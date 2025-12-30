import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Copy, X, Table as TableIcon, FileJson, FileCode, ArrowLeft, ChevronRight, Terminal, ExternalLink, Link2, Settings2, DatabaseZap } from 'lucide-react';
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
      if (!res.ok) throw new Error(`请求失败 (${res.status}): ${res.statusText}`);
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
                  throw new Error("服务端返回了 XML 格式数据，已自动切至 XML 视图。");
              }
              throw new Error("JSON 解析失败。");
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayUrl);
  };

  const currentTableData = useMemo(() => {
      if (drillStack.length > 0) return normalizeODataResponse(drillStack[drillStack.length - 1].data);
      if (resultData) return normalizeODataResponse(resultData);
      return [];
  }, [resultData, drillStack]);

  return (
    <div className="flex h-full bg-canvas overflow-hidden">
      <Sidebar 
        schema={schema} selectedSet={selectedSet} onSetChange={setSelectedSet} currentEntity={currentEntity}
        selectedProps={selectedProps} onPropChange={setSelectedProps} expandProps={expandProps} onExpandChange={setExpandProps}
        filter={filter} onFilterChange={setFilter} orderBy={orderBy} onOrderByChange={setOrderBy}
        orderByDir={orderByDir} onOrderByDirChange={setOrderByDir} top={top} onTopChange={setTop}
        skip={skip} onSkipChange={setSkip} count={count} onCountChange={setCount}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* 控制面板 */}
        <div className="bg-surface border-b border-border p-5 z-10 shrink-0 shadow-sm transition-colors">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                    <Link2 className="w-4 h-4" />
                 </div>
                 <h2 className="font-bold text-sm text-text-main">查询 URL</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="btn-secondary py-1 text-xs">
                    <Copy className="w-3.5 h-3.5" /> 复制链接
                </button>
                <a href={displayUrl} target="_blank" rel="noreferrer" className="btn-secondary py-1 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> 浏览器打开
                </a>
              </div>
           </div>
           
           <div className="bg-canvas border border-border rounded-xl p-4 group mb-5 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 p-1 px-2 text-[9px] font-bold uppercase tracking-widest text-text-muted bg-border/40 rounded-bl-lg">Endpoint</div>
              <code className="text-xs font-mono text-brand break-all whitespace-pre-wrap block max-h-24 overflow-y-auto custom-scrollbar leading-relaxed">
                {displayUrl}
              </code>
           </div>

           <div className="flex items-center justify-between">
                <div className="inline-flex bg-surface-hover p-1.5 rounded-xl border border-border">
                    <button 
                        onClick={() => handleTabChange('json')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'json' ? 'bg-surface text-brand shadow-md scale-[1.02]' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <FileJson className="w-4 h-4" /> JSON 视图
                    </button>
                    <button 
                        onClick={() => handleTabChange('table')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'table' ? 'bg-surface text-brand shadow-md scale-[1.02]' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <TableIcon className="w-4 h-4" /> 数据表格
                    </button>
                    <button 
                        onClick={() => handleTabChange('xml')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'xml' ? 'bg-surface text-orange-600 shadow-md scale-[1.02]' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <FileCode className="w-4 h-4" /> XML 源码
                    </button>
                </div>

                <button 
                    onClick={() => executeQuery()} 
                    disabled={loading || !generatedUrl}
                    className="btn-primary"
                >
                    {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                    <DatabaseZap className="w-4 h-4" />
                    )}
                    执行查询 (GET)
                </button>
           </div>
        </div>

        {/* 结果显示区 - 统一滚动控制 */}
        <div className="flex-1 overflow-auto bg-canvas flex flex-col">
           {error && (
             <div className="m-6 p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
                <div className="bg-red-500 text-white p-1 rounded-full shrink-0"><X className="w-3.5 h-3.5" /></div>
                <div className="flex-1">
                    <p className="font-bold mb-1">执行错误</p>
                    <div className="whitespace-pre-wrap font-mono break-all opacity-80">{error}</div>
                </div>
             </div>
           )}

           {!error && !resultData && !resultXml && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-40 select-none">
                <div className="bg-surface-hover p-8 rounded-full mb-4 shadow-inner">
                    <Terminal className="w-16 h-16" />
                </div>
                <p className="text-sm font-bold tracking-widest uppercase">等待输入查询命令...</p>
             </div>
           )}

           {(resultData || resultXml) && (
               <div className="h-full w-full">
                   {activeTab === 'json' && resultData && (
                       <div className="p-6">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                                <h3 className="text-xs font-bold text-text-muted flex items-center gap-2 uppercase tracking-widest">
                                    <FileJson className="w-3.5 h-3.5" /> JSON Tree View
                                </h3>
                                {resultData['@odata.count'] && <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full text-[10px] font-bold">Total: {resultData['@odata.count']}</span>}
                            </div>
                            <JsonNode value={resultData} />
                       </div>
                   )}

                   {activeTab === 'table' && resultData && (
                       <div className="h-full flex flex-col">
                            {drillStack.length > 0 && (
                                <div className="flex items-center gap-2 p-3 bg-brand/5 border-b border-border text-xs overflow-x-auto sticky top-0 z-20 backdrop-blur-md">
                                    <button onClick={() => setDrillStack([])} className="btn-secondary py-1 text-[10px]">
                                        <ArrowLeft className="w-3 h-3" /> 返回根级
                                    </button>
                                    {drillStack.map((item, idx) => (
                                        <React.Fragment key={idx}>
                                            <ChevronRight className="w-3 h-3 text-text-muted" />
                                            <span className="px-2 py-1 bg-surface rounded-md border border-border font-bold text-brand shadow-sm">{item.title}</span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                            <DataTable 
                                data={currentTableData} 
                                onDrillDown={(k, d) => setDrillStack(prev => [...prev, { title: k, data: d }])} 
                                columnTypes={drillStack.length === 0 ? rootColumnTypes : undefined}
                            />
                       </div>
                   )}

                   {activeTab === 'xml' && resultXml && (
                        <div className="p-0 h-full">
                            <div className="px-6 py-4 border-b border-border bg-canvas/50 text-xs font-bold text-text-muted flex items-center gap-2 sticky top-0 z-10 backdrop-blur-md">
                                <FileCode className="w-3.5 h-3.5" /> XML Metadata Explorer
                            </div>
                            {/* 注意：XmlViewer 内部已移除 overflow-auto，实现单滚动条 */}
                            <XmlViewer xmlString={resultXml} />
                        </div>
                   )}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default QueryBuilder;