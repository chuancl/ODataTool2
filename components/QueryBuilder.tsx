import React, { useState, useEffect, useMemo } from 'react';
import { Play, Copy, X, Table as TableIcon, FileJson, FileCode, ArrowLeft, ChevronRight, ExternalLink, Link2, Database, Download } from 'lucide-react';
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

type TabType = 'json' | 'table' | 'xml';

const QueryBuilder: React.FC<QueryBuilderProps> = ({ schema, metadataUrl }) => {
  const serviceRoot = useMemo(() => {
    return metadataUrl.replace(/\/\$metadata$/, '').replace(/\/$/, '');
  }, [metadataUrl]);

  const [selectedSet, setSelectedSet] = useState<string>('');
  const [selectedProps, setSelectedProps] = useState<Set<string>>(new Set());
  const [expandProps, setExpandProps] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [orderByDir, setOrderByDir] = useState<'asc' | 'desc'>('asc');
  const [top, setTop] = useState<number | ''>('');
  const [skip, setSkip] = useState<number | ''>('');
  const [count, setCount] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('json');
  const [resultData, setResultData] = useState<any>(null);
  const [resultXml, setResultXml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drillStack, setDrillStack] = useState<Array<{ title: string, data: any }>>([]);

  // Init selection
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

  // Reset fields on entity change
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
      if (!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);
      const text = await res.text();
      if (targetFormat === 'json') {
          try {
              const json = JSON.parse(text);
              setResultData(json);
              setResultXml('');
          } catch (e) {
              if (text.trim().startsWith('<')) {
                  setResultXml(text);
                  setResultData(null);
                  setActiveTab('xml');
                  throw new Error("Received XML response, switched to XML view.");
              }
              throw new Error("Failed to parse JSON.");
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
      if (newTab === 'xml' && !resultXml) executeQuery('xml');
      if ((newTab === 'json' || newTab === 'table') && !resultData) executeQuery('json');
  };

  const copyToClipboard = () => navigator.clipboard.writeText(displayUrl);

  const currentTableData = useMemo(() => {
      if (drillStack.length > 0) return normalizeODataResponse(drillStack[drillStack.length - 1].data);
      if (resultData) return normalizeODataResponse(resultData);
      return [];
  }, [resultData, drillStack]);

  return (
    <div className="flex h-full w-full bg-canvas overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar 
        schema={schema} selectedSet={selectedSet} onSetChange={setSelectedSet} currentEntity={currentEntity}
        selectedProps={selectedProps} onPropChange={setSelectedProps} expandProps={expandProps} onExpandChange={setExpandProps}
        filter={filter} onFilterChange={setFilter} orderBy={orderBy} onOrderByChange={setOrderBy}
        orderByDir={orderByDir} onOrderByDirChange={setOrderByDir} top={top} onTopChange={setTop}
        skip={skip} onSkipChange={setSkip} count={count} onCountChange={setCount}
      />

      {/* 主视图区 */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        {/* 顶部工具条：URL Bar */}
        <div className="border-b border-border bg-surface-muted p-2 flex flex-col gap-2 shrink-0">
           {/* URL Input Area */}
           <div className="flex items-stretch gap-2">
                <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-border rounded-md px-3 py-1.5 shadow-sm transition-all focus-within:ring-1 focus-within:ring-brand focus-within:border-brand">
                    <span className="text-[10px] font-bold text-text-muted mr-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded select-none">GET</span>
                    <input 
                        readOnly 
                        value={displayUrl} 
                        className="flex-1 bg-transparent text-xs font-mono text-text-main outline-none w-full" 
                        onFocus={(e) => e.target.select()}
                    />
                    <div className="h-4 w-[1px] bg-border mx-2"></div>
                    <button onClick={copyToClipboard} className="text-text-muted hover:text-text-main" title="Copy URL">
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={displayUrl} target="_blank" rel="noreferrer" className="ml-2 text-text-muted hover:text-text-main" title="Open in New Tab">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
                <button 
                    onClick={() => executeQuery()} 
                    disabled={loading || !generatedUrl}
                    className="btn-primary px-4"
                >
                    {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span className="ml-1">Run</span>
                </button>
           </div>
           
           {/* Tabs & Status */}
           <div className="flex items-center justify-between pl-1">
                <div className="flex gap-1">
                    <button 
                        onClick={() => handleTabChange('json')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all ${activeTab === 'json' ? 'border-brand text-brand bg-white dark:bg-slate-800' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    >
                        JSON Tree
                    </button>
                    <button 
                        onClick={() => handleTabChange('table')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all ${activeTab === 'table' ? 'border-brand text-brand bg-white dark:bg-slate-800' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    >
                        Table Grid
                    </button>
                    <button 
                        onClick={() => handleTabChange('xml')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all ${activeTab === 'xml' ? 'border-brand text-brand bg-white dark:bg-slate-800' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    >
                        Raw XML
                    </button>
                </div>
                {resultData && resultData['@odata.count'] && (
                    <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded font-mono font-medium">
                        Total: {resultData['@odata.count']}
                    </span>
                )}
           </div>
        </div>

        {/* 内容显示区 */}
        <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900">
           {error && (
             <div className="absolute inset-x-0 top-0 z-20 bg-red-50 border-b border-red-100 p-2 text-xs text-red-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full ml-1"></div>
                <span className="font-mono flex-1 truncate">{error}</span>
                <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
             </div>
           )}

           {!error && !resultData && !resultXml && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-text-muted/30 select-none">
                <Database className="w-12 h-12 mb-2 stroke-1" />
                <p className="text-xs font-medium uppercase tracking-widest">Ready to Query</p>
             </div>
           )}

           <div className={`h-full w-full overflow-auto ${(resultData || resultXml) ? 'block' : 'hidden'}`}>
                {activeTab === 'json' && resultData && (
                    <div className="p-4">
                        <JsonNode value={resultData} />
                    </div>
                )}

                {activeTab === 'table' && resultData && (
                    <div className="h-full flex flex-col">
                        {drillStack.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-slate-50 border-b border-border text-xs shrink-0">
                                <button onClick={() => setDrillStack([])} className="hover:bg-slate-200 p-1 rounded transition-colors text-text-sec">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-text-muted">/</span>
                                {drillStack.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <span className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] font-mono text-brand truncate max-w-[100px]">
                                            {item.title}
                                        </span>
                                        {idx < drillStack.length - 1 && <ChevronRight className="w-3 h-3 text-text-muted" />}
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