import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Copy, X, Table as TableIcon, FileJson, FileCode, ArrowLeft, ChevronRight, ExternalLink, Settings2, SlidersHorizontal, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ODataSchema } from '../types';
import { normalizeODataResponse } from './query-builder/utils';
import Sidebar from './query-builder/Sidebar';
import JsonNode from './query-builder/JsonViewer'; // 重写为库
import XmlViewer from './query-builder/XmlViewer'; // 重写为库
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
  const [isUrlDirty, setIsUrlDirty] = useState(false); // 用户是否手动修改过 URL

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

  // Reset when entity changes
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
    setIsUrlDirty(false); // Reset dirty state
  }, [selectedSet]);

  // Auto-generate URL from sidebar inputs
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

  // Sync Input with Generated URL (unless dirty)
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
    const targetUrl = urlInput; // Use the input box value
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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === id 
            ? 'bg-[var(--accent-color)] text-white shadow-sm' 
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-app)]'
        }`}
      >
          <Icon className="w-3.5 h-3.5" />
          {label}
      </button>
  );

  return (
    <div className="flex h-full w-full bg-[var(--bg-app)] text-[var(--text-primary)] font-sans overflow-hidden">
        {/* Left Sidebar (Config) */}
        <div className={`shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] transition-all duration-200 ease-in-out flex flex-col ${showConfig ? 'w-[280px]' : 'w-0 overflow-hidden'}`}>
             <Sidebar 
                schema={schema} selectedSet={selectedSet} onSetChange={setSelectedSet} currentEntity={currentEntity}
                selectedProps={selectedProps} onPropChange={setSelectedProps} expandProps={expandProps} onExpandChange={setExpandProps}
                filter={filter} onFilterChange={setFilter} orderBy={orderBy} onOrderByChange={setOrderBy}
                orderByDir={orderByDir} onOrderByDirChange={setOrderByDir} top={top} onTopChange={setTop}
                skip={skip} onSkipChange={setSkip} count={count} onCountChange={setCount}
            />
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-app)]">
            
            {/* Top Bar */}
            <div className="h-12 shrink-0 border-b border-[var(--border-color)] flex items-center px-3 gap-3 bg-[var(--bg-header)]">
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-sidebar)] transition-colors border border-transparent hover:border-[var(--border-color)]"
                    title="Toggle Config Panel"
                >
                    {showConfig ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                </button>

                {/* Editable URL Input */}
                <div className="flex-1 h-8 bg-[var(--bg-input)] border border-[var(--border-color)] rounded flex items-center px-2 relative transition-all focus-within:border-[var(--accent-color)] focus-within:ring-1 focus-within:ring-[var(--accent-color)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] mr-2 select-none bg-[var(--bg-sidebar)] px-1 rounded">GET</span>
                    <input 
                        value={urlInput}
                        onChange={handleUrlInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && executeQuery()}
                        className="flex-1 bg-transparent w-full outline-none text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)]" 
                        spellCheck={false}
                        placeholder="https://..."
                    />
                    <div className="flex items-center gap-1 pl-2 border-l border-[var(--border-color)] ml-2">
                        <button onClick={copyToClipboard} className="p-1 rounded hover:bg-[var(--bg-sidebar)] text-[var(--text-secondary)] transition-colors" title="Copy URL">
                            <Copy className="w-3 h-3" />
                        </button>
                        <a href={urlInput} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-[var(--bg-sidebar)] text-[var(--text-secondary)] transition-colors" title="Open in New Tab">
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Run Button */}
                <button 
                    onClick={() => executeQuery()}
                    disabled={loading || !urlInput}
                    className="h-8 px-4 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded font-medium text-xs shadow-sm flex items-center gap-2 transition-all active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                    <span>Run</span>
                </button>
            </div>

            {/* Content Area - 减少 Padding */}
            <div className="flex-1 p-2 overflow-hidden flex flex-col">
                <div className="flex-1 w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-md flex flex-col overflow-hidden relative shadow-sm">
                    
                    {/* Tabs Header */}
                    <div className="h-10 border-b border-[var(--border-color)] flex items-center px-3 justify-between bg-[var(--bg-header)] shrink-0">
                        <div className="flex items-center gap-2">
                            <TabButton id="table" label="Table" icon={TableIcon} />
                            <TabButton id="json" label="JSON" icon={FileJson} />
                            <TabButton id="xml" label="XML" icon={FileCode} />
                        </div>
                        {resultData && resultData['@odata.count'] && (
                            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                                {resultData['@odata.count']} records
                            </div>
                        )}
                    </div>

                    {/* Viewport */}
                    <div className="flex-1 overflow-hidden relative bg-[var(--bg-panel)]">
                        {error && (
                            <div className="absolute top-0 left-0 right-0 z-20 m-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                                <X className="w-4 h-4 shrink-0 mt-0.5" />
                                <div className="font-mono break-all">{error}</div>
                                <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 dark:hover:bg-red-800/40 rounded p-1"><X className="w-3 h-3"/></button>
                            </div>
                        )}

                        {!resultData && !resultXml && !loading && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] select-none">
                                <Settings2 className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-xs font-medium">Configure and run your query</p>
                            </div>
                        )}

                        {/* 使用 overflow-auto 确保内容区域自身滚动 */}
                        <div className="w-full h-full overflow-hidden">
                            {activeTab === 'json' && resultData && <JsonNode value={resultData} />}
                            
                            {activeTab === 'xml' && resultXml && <XmlViewer xmlString={resultXml} />}
                            
                            {activeTab === 'table' && resultData && (
                                <div className="h-full flex flex-col">
                                    {drillStack.length > 0 && (
                                        <div className="flex items-center gap-2 p-2 bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] text-xs shrink-0 sticky top-0 z-20">
                                            <button onClick={() => setDrillStack([])} className="p-1 rounded hover:bg-[var(--border-color)] text-[var(--text-secondary)]">
                                                <ArrowLeft className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-[var(--text-muted)]">Root</span>
                                            {drillStack.map((item, idx) => (
                                                <React.Fragment key={idx}>
                                                    <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                                                    <span className="px-1.5 py-0.5 bg-[var(--bg-app)] rounded border border-[var(--border-color)] text-[var(--text-primary)] truncate max-w-[150px]">
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