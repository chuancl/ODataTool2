import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Copy, X, Table as TableIcon, FileJson, FileCode, ArrowLeft, ChevronRight, ExternalLink, Settings2, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, Zap } from 'lucide-react';
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
  
  // Custom URL State
  const [urlInput, setUrlInput] = useState('');
  const [isUrlDirty, setIsUrlDirty] = useState(false); 

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('table');
  const [resultData, setResultData] = useState<any>(null);
  const [resultXml, setResultXml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drillStack, setDrillStack] = useState<Array<{ title: string, data: any }>>([]);
  const [showConfig, setShowConfig] = useState(true);

  // Initialization
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
    setIsUrlDirty(false); 
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

  useEffect(() => {
      if (!isUrlDirty) {
          setUrlInput(generatedUrl);
      }
  }, [generatedUrl, isUrlDirty]);

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUrlInput(e.target.value);
      setIsUrlDirty(true);
  };

  const executeQuery = async (forceFormat?: 'json' | 'xml') => {
    const targetUrl = urlInput;
    if (!targetUrl) return;

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
      const res = await fetch(targetUrl, { headers });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      const text = await res.text();
      
      if (targetFormat === 'json') {
          try {
              const json = JSON.parse(text);
              setResultData(json);
              setResultXml('');
              if (activeTab === 'xml') setActiveTab('json');
          } catch (e) {
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

  const currentTableData = useMemo(() => {
      if (drillStack.length > 0) return normalizeODataResponse(drillStack[drillStack.length - 1].data);
      if (resultData) return normalizeODataResponse(resultData);
      return [];
  }, [resultData, drillStack]);

  const copyToClipboard = () => navigator.clipboard.writeText(urlInput);

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === id 
            ? 'text-main' 
            : 'text-muted hover:text-sec'
        }`}
      >
          <Icon className="w-4 h-4" />
          {label}
          {activeTab === id && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[rgb(var(--c-accent))] rounded-t-full"></span>
          )}
      </button>
  );

  return (
    <div className="flex h-full w-full bg-app text-main font-sans overflow-hidden">
        {/* Left Sidebar (Config) */}
        <div className={`shrink-0 border-r border-base bg-sidebar transition-all duration-300 ease-in-out flex flex-col ${showConfig ? 'w-[280px]' : 'w-0 overflow-hidden opacity-0'}`}>
             <Sidebar 
                schema={schema} selectedSet={selectedSet} onSetChange={setSelectedSet} currentEntity={currentEntity}
                selectedProps={selectedProps} onPropChange={setSelectedProps} expandProps={expandProps} onExpandChange={setExpandProps}
                filter={filter} onFilterChange={setFilter} orderBy={orderBy} onOrderByChange={setOrderBy}
                orderByDir={orderByDir} onOrderByDirChange={setOrderByDir} top={top} onTopChange={setTop}
                skip={skip} onSkipChange={setSkip} count={count} onCountChange={setCount}
            />
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-app relative z-0">
            
            {/* Top Toolbar - Floating style */}
            <div className="h-16 shrink-0 flex items-center px-4 gap-3 bg-app/80 backdrop-blur-sm sticky top-0 z-10">
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className="p-2 rounded-lg text-muted hover:bg-hover hover:text-main transition-colors"
                    title={showConfig ? "隐藏侧栏" : "显示侧栏"}
                >
                    {showConfig ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                </button>

                {/* URL Input Bar - Modern Pill Shape */}
                <div className="flex-1 h-10 bg-sidebar border border-base rounded-lg flex items-center px-3 relative transition-all focus-within:ring-2 focus-within:ring-[rgb(var(--c-accent))]/20 focus-within:border-[rgb(var(--c-accent))]">
                    <div className="bg-[rgb(var(--c-accent))]/10 text-[rgb(var(--c-accent))] px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 tracking-wide select-none">GET</div>
                    <input 
                        value={urlInput}
                        onChange={handleUrlInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && executeQuery()}
                        className="flex-1 input-reset text-sm font-mono text-main placeholder-muted" 
                        spellCheck={false}
                        placeholder="https://api.example.com/odata/..."
                    />
                    <div className="flex items-center gap-1 pl-2 ml-2 border-l border-base">
                        <button onClick={copyToClipboard} className="btn-icon" title="Copy">
                            <Copy className="w-4 h-4" />
                        </button>
                        <a href={urlInput} target="_blank" rel="noreferrer" className="btn-icon" title="Open">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Run Button - Prominent */}
                <button 
                    onClick={() => executeQuery()}
                    disabled={loading || !urlInput}
                    className="h-10 px-6 bg-[rgb(var(--c-accent))] hover:bg-[rgb(var(--c-accent-hover))] text-[rgb(var(--c-accent-fg))] rounded-lg font-semibold text-sm shadow-md shadow-[rgb(var(--c-accent))]/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>Run</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
                <div className="flex-1 w-full flex flex-col overflow-hidden relative rounded-xl border border-base bg-app shadow-sm">
                    
                    {/* Tabs Header */}
                    <div className="h-11 border-b border-base flex items-center px-2 justify-between bg-app shrink-0">
                        <div className="flex items-center">
                            <TabButton id="table" label="Table" icon={TableIcon} />
                            <TabButton id="json" label="JSON" icon={FileJson} />
                            <TabButton id="xml" label="XML" icon={FileCode} />
                        </div>
                        {resultData && resultData['@odata.count'] && (
                            <div className="mr-3 text-xs font-medium text-sec flex items-center gap-1.5 bg-sidebar px-2 py-1 rounded-md border border-base">
                                <Zap className="w-3.5 h-3.5 text-[rgb(var(--c-accent))]" />
                                <span>{resultData['@odata.count']} records</span>
                            </div>
                        )}
                    </div>

                    {/* Viewport */}
                    <div className="flex-1 overflow-hidden relative bg-app">
                        {error && (
                            <div className="absolute top-4 left-4 right-4 z-20 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start gap-3 shadow-lg">
                                <X className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="font-mono break-all flex-1">{error}</div>
                                <button onClick={() => setError(null)} className="hover:bg-red-100 dark:hover:bg-red-800/30 rounded p-1 transition-colors"><X className="w-4 h-4"/></button>
                            </div>
                        )}

                        {!resultData && !resultXml && !loading && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted select-none">
                                <div className="w-16 h-16 rounded-2xl bg-sidebar flex items-center justify-center mb-4">
                                    <Settings2 className="w-8 h-8 opacity-40" />
                                </div>
                                <p className="text-sm font-medium">配置参数并点击运行</p>
                            </div>
                        )}

                        <div className="w-full h-full overflow-hidden">
                            {activeTab === 'json' && resultData && <div className="h-full w-full bg-[rgb(var(--c-bg-sidebar))]"><JsonNode value={resultData} /></div>}
                            
                            {activeTab === 'xml' && resultXml && <div className="h-full w-full bg-[rgb(var(--c-bg-sidebar))]"><XmlViewer xmlString={resultXml} /></div>}
                            
                            {activeTab === 'table' && resultData && (
                                <div className="h-full flex flex-col">
                                    {drillStack.length > 0 && (
                                        <div className="flex items-center gap-2 p-2 bg-hover border-b border-base text-xs shrink-0 sticky top-0 z-20">
                                            <button onClick={() => setDrillStack([])} className="p-1.5 rounded-md hover:bg-active text-sec transition-colors">
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-muted">Root</span>
                                            {drillStack.map((item, idx) => (
                                                <React.Fragment key={idx}>
                                                    <ChevronRight className="w-3.5 h-3.5 text-muted" />
                                                    <span className="px-2 py-0.5 bg-app rounded border border-base text-main font-medium truncate max-w-[150px]">
                                                        {item.title}
                                                    </span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-auto bg-app">
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