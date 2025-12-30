import React, { useState, useEffect, useMemo } from 'react';
import { Play, Copy, X, Table as TableIcon, FileJson, FileCode, ArrowLeft, ChevronRight, ExternalLink, Settings2, SlidersHorizontal } from 'lucide-react';
import { ODataSchema } from '../types';
import { normalizeODataResponse } from './query-builder/utils';
import Sidebar from './query-builder/Sidebar';
import JsonNode from './query-builder/JsonViewer';
import XmlViewer from './query-builder/XmlViewer';
import DataTable from './query-builder/TableViewer';

interface QueryBuilderProps {
  schema: ODataSchema;
  metadataUrl: string;
}

type TabType = 'table' | 'json' | 'xml';

const QueryBuilder: React.FC<QueryBuilderProps> = ({ schema, metadataUrl }) => {
  const serviceRoot = useMemo(() => {
    return metadataUrl.replace(/\/\$metadata$/, '').replace(/\/$/, '');
  }, [metadataUrl]);

  // Query State
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [selectedProps, setSelectedProps] = useState<Set<string>>(new Set());
  const [expandProps, setExpandProps] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [orderByDir, setOrderByDir] = useState<'asc' | 'desc'>('asc');
  const [top, setTop] = useState<number | ''>('');
  const [skip, setSkip] = useState<number | ''>('');
  const [count, setCount] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('table');
  const [resultData, setResultData] = useState<any>(null);
  const [resultXml, setResultXml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drillStack, setDrillStack] = useState<Array<{ title: string, data: any }>>([]);
  
  // Sidebar visibility
  const [showConfig, setShowConfig] = useState(true);

  useEffect(() => {
    if (schema.entitySets.length > 0 && !selectedSet) {
      setSelectedSet(schema.entitySets[0].name);
    }
  }, [schema]);

  const currentEntity = useMemo(() => {
    const setDef = schema.entitySets.find(s => s.name === selectedSet);
    if (!setDef) return null;
    const typeName = setDef.entityType.split('.').pop(); 
    return schema.entities.find(e => e.name === typeName || e.name === setDef.entityType);
  }, [selectedSet, schema]);

  const rootColumnTypes = useMemo(() => {
      const map = new Map<string, string>();
      if (currentEntity) {
          currentEntity.properties.forEach(p => map.set(p.name, p.type));
      }
      return map;
  }, [currentEntity]);

  // Reset results on entity change
  useEffect(() => {
    setSelectedProps(new Set());
    setExpandProps(new Set());
    setFilter('');
    setOrderBy('');
    setTop('');
    setSkip('');
    setResultData(null);
    setResultXml('');
    setError(null);
    setDrillStack([]);
  }, [selectedSet]);

  const generatedUrl = useMemo(() => {
    if (!selectedSet) return '';
    const params = new URLSearchParams();
    if (selectedProps.size > 0 && currentEntity && selectedProps.size < currentEntity.properties.length) {
      params.append('$select', Array.from(selectedProps).join(','));
    }
    if (expandProps.size > 0) params.append('$expand', Array.from(expandProps).join(','));
    if (filter) params.append('$filter', filter);
    if (orderBy) params.append('$orderby', `${orderBy} ${orderByDir}`);
    if (top !== '') params.append('$top', String(top));
    if (skip !== '') params.append('$skip', String(skip));
    if (count) {
        const isV4 = schema.version && schema.version.startsWith('4');
        if (isV4) params.append('$count', 'true');
        else params.append('$inlinecount', 'allpages');
    }
    const queryString = params.toString();
    return `${serviceRoot}/${selectedSet}${queryString ? '?' + queryString : ''}`;
  }, [serviceRoot, selectedSet, selectedProps, expandProps, filter, orderBy, orderByDir, top, skip, count, currentEntity, schema.version]);

  const displayUrl = useMemo(() => {
    if (!generatedUrl) return '';
    try { return decodeURIComponent(generatedUrl.replace(/\+/g, '%20')); } catch (e) { return generatedUrl; }
  }, [generatedUrl]);

  const executeQuery = async (forceFormat?: 'json' | 'xml') => {
    if (!generatedUrl) return;
    setLoading(true);
    setError(null);
    setDrillStack([]);
    const targetFormat = forceFormat || (activeTab === 'xml' ? 'xml' : 'json');

    try {
      const headers: any = {};
      if (targetFormat === 'xml') {
          headers['Accept'] = 'application/atom+xml, application/xml, text/xml';
      } else {
          headers['Accept'] = 'application/json, application/json;odata.metadata=minimal';
      }
      const res = await fetch(generatedUrl, { headers });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      const text = await res.text();
      
      if (targetFormat === 'json') {
          try {
              const json = JSON.parse(text);
              setResultData(json);
              setResultXml('');
              // If we were in XML tab but got JSON, switch to Table or JSON
              if (activeTab === 'xml') setActiveTab('json');
          } catch (e) {
              // Maybe it's XML returned despite requesting JSON
              if (text.trim().startsWith('<')) {
                  setResultXml(text);
                  setResultData(null);
                  setActiveTab('xml');
              } else {
                  throw new Error("Failed to parse response as JSON");
              }
          }
      } else {
          setResultXml(text);
          setResultData(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: TabType) => {
      setActiveTab(newTab);
      // Auto-re-execute if we switch data formats and don't have data yet
      if (newTab === 'xml' && !resultXml && generatedUrl) executeQuery('xml');
      if ((newTab === 'json' || newTab === 'table') && !resultData && generatedUrl && !resultXml) executeQuery('json');
  };

  const currentTableData = useMemo(() => {
      if (drillStack.length > 0) return normalizeODataResponse(drillStack[drillStack.length - 1].data);
      if (resultData) return normalizeODataResponse(resultData);
      return [];
  }, [resultData, drillStack]);

  const copyToClipboard = () => navigator.clipboard.writeText(displayUrl);

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
      <button 
        onClick={() => handleTabChange(id)}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === id 
            ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
      >
          <Icon className="w-3.5 h-3.5" />
          {label}
      </button>
  );

  return (
    <div className="flex h-full w-full bg-[#09090b] text-zinc-200 font-sans overflow-hidden">
        {/* Left Sidebar (Config) */}
        <div className={`shrink-0 border-r border-zinc-800 bg-[#121214] transition-all duration-300 ease-in-out ${showConfig ? 'w-[320px] translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
             <Sidebar 
                schema={schema} selectedSet={selectedSet} onSetChange={setSelectedSet} currentEntity={currentEntity}
                selectedProps={selectedProps} onPropChange={setSelectedProps} expandProps={expandProps} onExpandChange={setExpandProps}
                filter={filter} onFilterChange={setFilter} orderBy={orderBy} onOrderByChange={setOrderBy}
                orderByDir={orderByDir} onOrderByDirChange={setOrderByDir} top={top} onTopChange={setTop}
                skip={skip} onSkipChange={setSkip} count={count} onCountChange={setCount}
            />
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
            
            {/* Top Bar: URL & Actions */}
            <div className="h-16 shrink-0 border-b border-zinc-800 flex items-center px-4 gap-4 bg-[#09090b]">
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className={`p-2 rounded-lg transition-colors ${showConfig ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                    title="Toggle Config Panel"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                </button>

                {/* URL Input Bar */}
                <div className="flex-1 h-10 bg-[#18181b] border border-zinc-800 hover:border-zinc-700 rounded-md flex items-center px-3 relative transition-all group focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-violet-500/50">
                    <span className="text-[10px] font-bold text-zinc-500 mr-3 tracking-wider select-none">GET</span>
                    <input 
                        value={displayUrl}
                        readOnly
                        className="flex-1 bg-transparent w-full outline-none text-xs font-mono text-zinc-300 placeholder-zinc-700" 
                        spellCheck={false}
                    />
                    <div className="flex items-center gap-1 pl-2 border-l border-zinc-800 ml-2">
                        <button onClick={copyToClipboard} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy URL">
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a href={displayUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors" title="Open in New Tab">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* Run Button */}
                <button 
                    onClick={() => executeQuery()}
                    disabled={loading || !generatedUrl}
                    className="h-10 px-6 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-md font-semibold text-sm shadow-lg shadow-violet-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>Run</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
                {/* Result Container */}
                <div className="flex-1 w-full bg-[#121214] border border-zinc-800 rounded-xl flex flex-col overflow-hidden relative shadow-2xl">
                    
                    {/* Tabs Header (Inside Container) */}
                    <div className="h-12 border-b border-zinc-800 flex items-center px-4 justify-between bg-[#121214] shrink-0">
                        <div className="flex items-center gap-2">
                            <TabButton id="table" label="Table" icon={TableIcon} />
                            <TabButton id="json" label="JSON" icon={FileJson} />
                            <TabButton id="xml" label="XML" icon={FileCode} />
                        </div>
                        {resultData && resultData['@odata.count'] && (
                            <div className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {resultData['@odata.count']} records
                            </div>
                        )}
                    </div>

                    {/* Viewport */}
                    <div className="flex-1 overflow-auto bg-[#09090b] relative custom-scrollbar">
                        {/* Error State */}
                        {error && (
                            <div className="m-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-start gap-3">
                                <div className="p-1 bg-red-900/50 rounded text-red-400 shrink-0"><X className="w-4 h-4" /></div>
                                <div className="text-sm text-red-300 font-mono break-all">{error}</div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!resultData && !resultXml && !loading && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 select-none">
                                <Settings2 className="w-16 h-16 mb-4 opacity-20 stroke-1" />
                                <p className="text-sm font-medium">Configure and run your query</p>
                            </div>
                        )}

                        {/* Views */}
                        <div className="h-full w-full">
                            {activeTab === 'json' && resultData && <div className="p-6"><JsonNode value={resultData} /></div>}
                            
                            {activeTab === 'xml' && resultXml && <div className="p-6"><XmlViewer xmlString={resultXml} /></div>}
                            
                            {activeTab === 'table' && resultData && (
                                <div className="h-full flex flex-col">
                                    {drillStack.length > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0 sticky top-0 z-20">
                                            <button onClick={() => setDrillStack([])} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400">
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-zinc-600">Root</span>
                                            {drillStack.map((item, idx) => (
                                                <React.Fragment key={idx}>
                                                    <ChevronRight className="w-3 h-3 text-zinc-700" />
                                                    <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300 truncate max-w-[150px]">
                                                        {item.title}
                                                    </span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-auto">
                                        <DataTable 
                                            data={currentTableData} 
                                            onDrillDown={(k, d) => setDrillStack(prev => [...prev, { title: k, data: d }])} 
                                            columnTypes={drillStack.length === 0 ? rootColumnTypes : undefined}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default QueryBuilder;