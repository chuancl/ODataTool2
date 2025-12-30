import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Copy, X, Table as TableIcon, FileJson, FileCode, ArrowLeft, ChevronRight } from 'lucide-react';
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
  
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('json');
  
  // Result State
  const [resultData, setResultData] = useState<any>(null); // JSON Data
  const [resultXml, setResultXml] = useState<string>(''); // XML String
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drill Down Stack
  const [drillStack, setDrillStack] = useState<Array<{ title: string, data: any }>>([]);

  const isMounted = useRef(false);

  // 初始化 EntitySet
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

  // 构建当前 Entity 的字段类型 Map，用于传给 Table 渲染
  const rootColumnTypes = useMemo(() => {
      const map = new Map<string, string>();
      if (currentEntity) {
          currentEntity.properties.forEach(p => map.set(p.name, p.type));
      }
      return map;
  }, [currentEntity]);

  // 切换 EntitySet 重置状态
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

  // 生成 URL
  const generatedUrl = useMemo(() => {
    if (!selectedSet) return '';
    const params = new URLSearchParams();

    if (selectedProps.size > 0 && currentEntity && selectedProps.size < currentEntity.properties.length) {
      params.append('$select', Array.from(selectedProps).join(','));
    }

    if (expandProps.size > 0) {
      params.append('$expand', Array.from(expandProps).join(','));
    }

    if (filter) params.append('$filter', filter);
    
    if (orderBy) {
      params.append('$orderby', `${orderBy} ${orderByDir}`);
    }

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
    try {
      return decodeURIComponent(generatedUrl.replace(/\+/g, '%20'));
    } catch (e) {
      return generatedUrl;
    }
  }, [generatedUrl]);

  // 执行查询
  const executeQuery = async (forceFormat?: 'json' | 'xml') => {
    if (!generatedUrl) return;
    setLoading(true);
    setError(null);
    setDrillStack([]);

    // 决定请求格式: 如果是 Table 或 JSON 页签 -> JSON; 如果是 XML 页签 -> XML
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
              setResultXml(''); // 清除旧的 XML
          } catch (e) {
              // 失败降级
              if (text.trim().startsWith('<')) {
                  setResultXml(text);
                  setResultData(null);
                  setActiveTab('xml');
                  throw new Error("Server returned XML instead of JSON. Switched to XML view.");
              }
              throw new Error("Failed to parse JSON response.");
          }
      } else {
          setResultXml(text);
          setResultData(null); // 清除旧的 JSON
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理页签切换
  const handleTabChange = (newTab: TabType) => {
      setActiveTab(newTab);
      // 如果切换到 XML 且没有 XML 数据，强制刷新
      if (newTab === 'xml' && !resultXml) {
          executeQuery('xml');
      }
      // 如果切换到 JSON/Table 且没有 JSON 数据，强制刷新
      if ((newTab === 'json' || newTab === 'table') && !resultData) {
          executeQuery('json');
      }
  };

  const handleDrillDown = (key: string, data: any) => {
      setDrillStack(prev => [...prev, { title: key, data }]);
  };

  const handleDrillUp = (index: number) => {
      if (index === -1) {
          setDrillStack([]);
      } else {
          setDrillStack(prev => prev.slice(0, index + 1));
      }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayUrl);
  };

  // Table Data 计算
  const currentTableData = useMemo(() => {
      if (drillStack.length > 0) {
          return normalizeODataResponse(drillStack[drillStack.length - 1].data);
      }
      if (resultData) {
          return normalizeODataResponse(resultData);
      }
      return [];
  }, [resultData, drillStack]);

  if (!schema.entitySets.length) {
    return <div className="p-8 text-center text-text-muted">此 OData 服务未定义 EntitySets，无法构建查询。</div>;
  }

  return (
    <div className="flex h-full bg-canvas overflow-hidden">
      {/* --- 左侧配置面板 (Sidebar) --- */}
      <Sidebar 
        schema={schema}
        selectedSet={selectedSet}
        onSetChange={setSelectedSet}
        currentEntity={currentEntity}
        selectedProps={selectedProps}
        onPropChange={setSelectedProps}
        expandProps={expandProps}
        onExpandChange={setExpandProps}
        filter={filter}
        onFilterChange={setFilter}
        orderBy={orderBy}
        onOrderByChange={setOrderBy}
        orderByDir={orderByDir}
        onOrderByDirChange={setOrderByDir}
        top={top}
        onTopChange={setTop}
        skip={skip}
        onSkipChange={setSkip}
        count={count}
        onCountChange={setCount}
      />

      {/* --- 右侧结果面板 --- */}
      <div className="flex-1 flex flex-col bg-canvas overflow-hidden min-w-0">
        {/* Header Control Area */}
        <div className="bg-surface border-b border-border shadow-sm z-10 p-4 shrink-0 transition-colors">
           {/* URL & Copy */}
           <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-text-main flex items-center gap-2">
                 生成链接
                 <span className="text-[10px] font-normal text-text-muted bg-canvas px-1.5 py-0.5 rounded border border-border">GET</span>
              </h2>
              <button onClick={copyToClipboard} className="text-xs flex items-center gap-1 text-text-muted hover:text-brand transition px-2 py-1 rounded hover:bg-surface-hover">
                 <Copy className="w-3.5 h-3.5" /> 复制
              </button>
           </div>
           
           {/* URL Input Box */}
           <div className="bg-surface-hover border border-border rounded-md p-3 relative group mb-4 shadow-inner">
              <code className="text-xs font-mono text-brand break-all whitespace-pre-wrap block max-h-24 overflow-y-auto custom-scrollbar">
                {displayUrl}
              </code>
           </div>

           {/* Toolbar (Tabs & Action) */}
           <div className="flex items-end justify-between gap-4">
                <div className="flex bg-surface-hover p-1 rounded-lg border border-border">
                    <button 
                        onClick={() => handleTabChange('json')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'json' ? 'bg-surface text-brand shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <FileJson className="w-3.5 h-3.5" /> JSON
                    </button>
                    <button 
                        onClick={() => handleTabChange('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'table' ? 'bg-surface text-brand shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <TableIcon className="w-3.5 h-3.5" /> Table
                    </button>
                    <button 
                        onClick={() => handleTabChange('xml')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'xml' ? 'bg-surface text-orange-600 shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <FileCode className="w-3.5 h-3.5" /> XML
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => executeQuery()} 
                        disabled={loading || !generatedUrl}
                        className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-brand-fg px-5 py-2 rounded-md text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:translate-y-px"
                    >
                        {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                        <Play className="w-4 h-4 fill-current" />
                        )}
                        Run Query
                    </button>
                </div>
           </div>
        </div>

        {/* Result Area */}
        <div className="flex-1 overflow-hidden relative bg-canvas flex flex-col">
           {error && (
             <div className="m-4 p-4 bg-red-50/50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="mt-0.5 flex-shrink-0"><X className="w-4 h-4" /></div>
                <div className="whitespace-pre-wrap font-mono break-all">{error}</div>
             </div>
           )}

           {!error && !resultData && !resultXml && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-text-muted/30 select-none">
                <Play className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm font-medium text-text-muted">点击 "Run Query" 获取数据</p>
             </div>
           )}

           {(resultData || resultXml) && (
               <div className="flex-1 overflow-auto h-full w-full bg-surface relative">
                   {/* JSON View */}
                   {activeTab === 'json' && resultData && (
                       <div className="h-full w-full overflow-auto">
                            <div className="px-4 py-2 border-b border-border bg-canvas/50 text-xs font-bold text-text-muted flex justify-between sticky top-0 z-10 backdrop-blur-sm">
                                <span>JSON Tree</span>
                                {resultData['@odata.count'] && <span className="text-brand">Total: {resultData['@odata.count']}</span>}
                            </div>
                            <div className="p-4">
                                <JsonNode value={resultData} />
                            </div>
                       </div>
                   )}

                   {/* Table View */}
                   {activeTab === 'table' && resultData && (
                       <div className="flex flex-col h-full w-full">
                            {drillStack.length > 0 && (
                                <div className="flex items-center gap-2 p-2 bg-brand/5 border-b border-brand/20 text-xs overflow-x-auto whitespace-nowrap sticky top-0 z-20 shadow-sm">
                                    <button onClick={() => handleDrillUp(-1)} className="hover:bg-brand/10 p-1.5 rounded text-brand font-bold flex items-center gap-1 transition-colors">
                                        <ArrowLeft className="w-3.5 h-3.5" /> Root
                                    </button>
                                    {drillStack.map((item, idx) => (
                                        <React.Fragment key={idx}>
                                            <ChevronRight className="w-3 h-3 text-brand/40" />
                                            <button 
                                                onClick={() => handleDrillUp(idx)}
                                                className={`px-2 py-1 rounded transition-colors ${idx === drillStack.length - 1 ? 'bg-surface shadow-sm font-bold text-brand' : 'hover:bg-brand/10 text-brand'}`}
                                            >
                                                {item.title}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                            <div className="flex-1 overflow-auto">
                                <DataTable 
                                    data={currentTableData} 
                                    onDrillDown={handleDrillDown} 
                                    columnTypes={drillStack.length === 0 ? rootColumnTypes : undefined}
                                />
                            </div>
                       </div>
                   )}

                   {/* XML View */}
                   {activeTab === 'xml' && resultXml && (
                        <div className="h-full w-full overflow-auto">
                            <div className="px-4 py-2 border-b border-border bg-canvas/50 text-xs font-bold text-text-muted sticky top-0 z-10 backdrop-blur-sm">
                                <span>XML Tree</span>
                            </div>
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