import React, { useState, useEffect, useMemo } from 'react';
import { Play, Copy, X, Table as TableIcon, FileJson, FileCode, ArrowLeft, ChevronRight, ExternalLink, Link2, Download, Search } from 'lucide-react';
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

  // Reset on Entity Change
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
    // Don't auto-run to avoid spamming, user must click run
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
              // If success, switch to table/json if we were in XML but got JSON
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

  const handleTabChange = (newTab: TabType) => {
      setActiveTab(newTab);
      // Auto-fetch if data missing
      if (newTab === 'xml' && !resultXml && !loading) executeQuery('xml');
      if ((newTab === 'json' || newTab === 'table') && !resultData && !loading) executeQuery('json');
  };

  const currentTableData = useMemo(() => {
      if (drillStack.length > 0) return normalizeODataResponse(drillStack[drillStack.length - 1].data);
      if (resultData) return normalizeODataResponse(resultData);
      return [];
  }, [resultData, drillStack]);

  const copyToClipboard = () => navigator.clipboard.writeText(displayUrl);

  return (
    <div className="flex h-full w-full bg-[var(--bg-app)] overflow-hidden">
      {/* --- Left Config Panel --- */}
      <Sidebar 
        schema={schema} selectedSet={selectedSet} onSetChange={setSelectedSet} currentEntity={currentEntity}
        selectedProps={selectedProps} onPropChange={setSelectedProps} expandProps={expandProps} onExpandChange={setExpandProps}
        filter={filter} onFilterChange={setFilter} orderBy={orderBy} onOrderByChange={setOrderBy}
        orderByDir={orderByDir} onOrderByDirChange={setOrderByDir} top={top} onTopChange={setTop}
        skip={skip} onSkipChange={setSkip} count={count} onCountChange={setCount}
      />

      {/* --- Right Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-panel)] border-l border-[var(--border-strong)]">
        
        {/* 1. Compact Address Bar */}
        <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex items-center gap-2 shrink-0">
             <div className="flex-1 flex items-center bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-md shadow-sm h-8 overflow-hidden focus-within:ring-1 focus-within:ring-[var(--accent-primary)] focus-within:border-[var(--accent-primary)] transition-all">
                <div className="bg-[var(--bg-app)] text-[var(--text-secondary)] text-[10px] font-bold px-2.5 h-full flex items-center border-r border-[var(--border-subtle)] select-none">
                    GET
                </div>
                <input 
                    readOnly 
                    value={displayUrl} 
                    className="flex-1 px-3 text-xs font-mono text-[var(--text-primary)] outline-none bg-transparent h-full"
                    onFocus={(e) => e.target.select()}
                />
                <div className="flex items-center gap-1 pr-1">
                    <button onClick={copyToClipboard} className="p-1.5 hover:bg-[var(--bg-app)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Copy URL">
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={displayUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-[var(--bg-app)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Open in New Tab">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
             </div>
             <button 
                onClick={() => executeQuery()} 
                disabled={loading || !generatedUrl}
                className="btn-primary h-8 px-5 flex items-center gap-2"
             >
                {loading ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Send
             </button>
        </div>

        {/* 2. Tabs Row */}
        <div className="flex items-center justify-between px-2 bg-[var(--bg-app)] border-b border-[var(--border-strong)] h-9 shrink-0">
             <div className="flex items-end h-full gap-1">
                {[
                    { id: 'table', icon: TableIcon, label: 'Table' },
                    { id: 'json', icon: FileJson, label: 'JSON' },
                    { id: 'xml', icon: FileCode, label: 'XML' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as TabType)}
                        className={`
                            flex items-center gap-2 px-4 h-8 text-xs font-medium rounded-t-md border-t border-r border-l border-b-0 transition-all
                            ${activeTab === tab.id 
                                ? 'bg-[var(--bg-panel)] border-[var(--border-strong)] text-[var(--accent-text)] relative top-[1px] shadow-sm' 
                                : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-panel)]/50 hover:text-[var(--text-primary)]'
                            }
                        `}
                    >
                        <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                ))}
             </div>
             {resultData && resultData['@odata.count'] && (
                <div className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent-surface)] text-[var(--accent-text)] font-mono border border-[var(--accent-primary)]/20">
                    Count: {resultData['@odata.count']}
                </div>
             )}
        </div>

        {/* 3. Result Content */}
        <div className="flex-1 relative overflow-hidden bg-[var(--bg-panel)]">
           {error && (
             <div className="absolute top-0 inset-x-0 z-20 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-2 text-xs text-red-600 dark:text-red-300 flex items-center justify-between">
                <span className="font-mono">{error}</span>
                <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
             </div>
           )}

           {!resultData && !resultXml && !loading && !error && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50 select-none">
                <Search className="w-12 h-12 mb-3 stroke-1" />
                <p className="text-sm">Ready to execute query</p>
             </div>
           )}

           <div className={`h-full w-full overflow-auto custom-scrollbar ${(resultData || resultXml) ? 'block' : 'hidden'}`}>
                {activeTab === 'json' && resultData && (
                    <div className="p-4">
                        <JsonNode value={resultData} />
                    </div>
                )}

                {activeTab === 'table' && resultData && (
                    <div className="h-full flex flex-col">
                        {drillStack.length > 0 && (
                            <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-app)] border-b border-[var(--border-subtle)] text-xs shrink-0 sticky top-0 z-20">
                                <button onClick={() => setDrillStack([])} className="hover:bg-[var(--border-subtle)] p-1 rounded text-[var(--text-secondary)]">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                <div className="h-4 w-px bg-[var(--border-strong)] mx-1"></div>
                                <div className="flex items-center overflow-hidden">
                                    {drillStack.map((item, idx) => (
                                        <div key={idx} className="flex items-center">
                                            {idx > 0 && <ChevronRight className="w-3 h-3 text-[var(--text-muted)] mx-1" />}
                                            <span className="px-1.5 py-0.5 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded text-[10px] font-mono text-[var(--text-primary)] truncate max-w-[100px]">
                                                {item.title}
                                            </span>
                                        </div>
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

                {activeTab === 'xml' && resultXml && (
                    <div className="p-4">
                        <XmlViewer xmlString={resultXml} />
                    </div>
                )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default QueryBuilder;