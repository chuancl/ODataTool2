import React, { useState, useEffect, useMemo } from 'react';
import { Play, Copy, X, Table, FileJson, FileCode, ArrowLeft, ChevronRight, ExternalLink, Filter, Plus, SlidersHorizontal, Settings2 } from 'lucide-react';
import { ODataSchema } from '../types';
import { normalizeODataResponse } from './query-builder/utils';
import JsonNode from './query-builder/JsonViewer';
import XmlViewer from './query-builder/XmlViewer';
import DataTable from './query-builder/TableViewer';
import Sidebar from './query-builder/Sidebar'; // Now acts as the Config Panel

interface QueryBuilderProps {
  schema: ODataSchema;
  metadataUrl: string;
}

type TabType = 'table' | 'json' | 'xml';

const QueryBuilder: React.FC<QueryBuilderProps> = ({ schema, metadataUrl }) => {
  const serviceRoot = useMemo(() => metadataUrl.replace(/\/\$metadata$/, '').replace(/\/$/, ''), [metadataUrl]);

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
  const [showConfig, setShowConfig] = useState(true); // Toggle for config panel

  // Init
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

  // Reset
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
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const text = await res.text();
      if (targetFormat === 'json') {
          try {
              const json = JSON.parse(text);
              setResultData(json);
              setResultXml('');
              if (activeTab === 'xml') setActiveTab('table'); 
          } catch (e) {
              if (text.trim().startsWith('<')) {
                  setResultXml(text);
                  setResultData(null);
                  setActiveTab('xml');
                  throw new Error("Received XML (auto-switched view)");
              }
              throw new Error("Invalid JSON response");
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

  const currentTableData = useMemo(() => {
      if (drillStack.length > 0) return normalizeODataResponse(drillStack[drillStack.length - 1].data);
      if (resultData) return normalizeODataResponse(resultData);
      return [];
  }, [resultData, drillStack]);

  const copyToClipboard = () => navigator.clipboard.writeText(displayUrl);

  return (
    <div className="flex flex-col h-full w-full">
        {/* --- Top Floating Island Bar --- */}
        <div className="p-4 bg-[var(--bg-surface)] border-b border-[var(--border-light)] shrink-0 flex items-center gap-4 z-20">
             {/* Toggle Config */}
             <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`p-2.5 rounded-xl transition-all border ${showConfig ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800'}`}
                title="Toggle Query Settings"
             >
                 <SlidersHorizontal className="w-5 h-5" />
             </button>

             {/* URL Display */}
             <div className="flex-1 flex items-center bg-[var(--bg-page)] rounded-xl border border-[var(--border-light)] p-1.5 pl-4 overflow-hidden relative group transition-colors focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
                <span className="text-[10px] font-bold text-zinc-400 select-none mr-2">GET</span>
                <input 
                    readOnly
                    value={displayUrl} 
                    className="flex-1 bg-transparent text-sm text-[var(--text-main)] outline-none font-mono truncate"
                    onFocus={(e) => e.target.select()}
                />
                <div className="flex gap-1 ml-2">
                    <button onClick={copyToClipboard} className="p-2 hover:bg-white rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"><Copy className="w-4 h-4"/></button>
                    <a href={displayUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-white rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"><ExternalLink className="w-4 h-4"/></a>
                </div>
             </div>

             {/* Run Button */}
             <button 
                onClick={() => executeQuery()}
                disabled={loading || !generatedUrl}
                className="btn-modern-primary w-28"
             >
                {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Run
             </button>
        </div>

        {/* --- Main Area --- */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left: Config Panel (Collapsible) */}
            <div className={`transition-all duration-300 ease-in-out border-r border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden flex flex-col ${showConfig ? 'w-[320px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10'}`}>
                <div className="p-4 border-b border-[var(--border-light)] flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Query Config</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <Sidebar 
                        schema={schema} selectedSet={selectedSet} onSetChange={setSelectedSet} currentEntity={currentEntity}
                        selectedProps={selectedProps} onPropChange={setSelectedProps} expandProps={expandProps} onExpandChange={setExpandProps}
                        filter={filter} onFilterChange={setFilter} orderBy={orderBy} onOrderByChange={setOrderBy}
                        orderByDir={orderByDir} onOrderByDirChange={setOrderByDir} top={top} onTopChange={setTop}
                        skip={skip} onSkipChange={setSkip} count={count} onCountChange={setCount}
                    />
                </div>
            </div>

            {/* Right: Results Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-page)] relative">
                
                {/* Result Tabs */}
                <div className="px-6 pt-4 flex items-center justify-between shrink-0">
                    <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-light)] shadow-sm">
                        {[
                            { id: 'table', icon: Table, label: 'Table' },
                            { id: 'json', icon: FileJson, label: 'JSON' },
                            { id: 'xml', icon: FileCode, label: 'XML' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-violet-50 text-violet-700 shadow-sm' 
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-page)]'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </div>
                    {resultData && resultData['@odata.count'] && (
                        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                            {resultData['@odata.count']} records
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-hidden">
                    <div className="w-full h-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-light)] shadow-sm overflow-hidden relative flex flex-col">
                        
                        {error && (
                            <div className="bg-red-50 border-b border-red-100 p-3 text-red-600 text-sm flex items-center justify-between">
                                <span>{error}</span>
                                <button onClick={() => setError(null)}><X className="w-4 h-4"/></button>
                            </div>
                        )}

                        {!resultData && !resultXml && !loading && !error && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 select-none">
                                <Settings2 className="w-16 h-16 mb-4 text-zinc-300" />
                                <p className="text-zinc-500 font-medium">Configure and run your query</p>
                             </div>
                        )}

                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {activeTab === 'json' && resultData && <div className="p-6"><JsonNode value={resultData} /></div>}
                            
                            {activeTab === 'xml' && resultXml && <div className="p-6"><XmlViewer xmlString={resultXml} /></div>}
                            
                            {activeTab === 'table' && resultData && (
                                <div className="h-full flex flex-col">
                                    {drillStack.length > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-zinc-50 border-b border-[var(--border-light)] text-sm shrink-0 sticky top-0 z-20">
                                            <button onClick={() => setDrillStack([])} className="p-1.5 rounded hover:bg-zinc-200 text-zinc-500">
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <div className="flex items-center overflow-hidden gap-1">
                                                <span className="text-zinc-400">Root</span>
                                                {drillStack.map((item, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <ChevronRight className="w-3 h-3 text-zinc-300" />
                                                        <span className="px-2 py-0.5 bg-white border rounded text-xs font-medium truncate max-w-[150px] shadow-sm">
                                                            {item.title}
                                                        </span>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-auto table-scroll">
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