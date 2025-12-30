import React, { useState, useEffect, useMemo } from 'react';
import { 
    Button,
    Input,
    Tabs, 
    Tab,
    Card,
    Tooltip,
    Snippet,
    Chip,
    Spinner,
    Divider
} from '@heroui/react';
import { 
    Play, 
    Copy, 
    X, 
    Table as TableIcon, 
    FileJson, 
    FileCode, 
    ArrowLeft, 
    ChevronRight, 
    ExternalLink, 
    Settings2, 
    PanelLeftClose, 
    PanelLeftOpen, 
    Zap,
    Link
} from 'lucide-react';
import { ODataSchema } from '../types';
import { normalizeODataResponse } from './query-builder/utils';
import Sidebar from './query-builder/Sidebar';
import JsonNode from './query-builder/JsonViewer';
import XmlViewer from './query-builder/XmlViewer';
import DataTable from './query-builder/TableViewer';

interface QueryBuilderProps {
  schema: ODataSchema;
  metadataUrl: string;
  theme: 'light' | 'dark';
}

type TabType = 'table' | 'json' | 'xml';

const QueryBuilder: React.FC<QueryBuilderProps> = ({ schema, metadataUrl, theme }) => {
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

  return (
    <div className="flex h-full w-full bg-default-50 overflow-hidden">
        {/* Left Sidebar (Config) */}
        <div 
            className={`shrink-0 border-r border-divider bg-background transition-all duration-300 ease-in-out flex flex-col ${showConfig ? 'w-[300px]' : 'w-0 overflow-hidden opacity-0'}`}
        >
             <Sidebar 
                schema={schema} selectedSet={selectedSet} onSetChange={setSelectedSet} currentEntity={currentEntity}
                selectedProps={selectedProps} onPropChange={setSelectedProps} expandProps={expandProps} onExpandChange={setExpandProps}
                filter={filter} onFilterChange={setFilter} orderBy={orderBy} onOrderByChange={setOrderBy}
                orderByDir={orderByDir} onOrderByDirChange={setOrderByDir} top={top} onTopChange={setTop}
                skip={skip} onSkipChange={setSkip} count={count} onCountChange={setCount}
            />
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative z-0">
            
            {/* Top Toolbar */}
            <div className="h-16 shrink-0 flex items-center px-4 gap-3 border-b border-divider bg-background/80 backdrop-blur sticky top-0 z-10">
                <Button 
                    isIconOnly 
                    variant="light" 
                    size="sm" 
                    onPress={() => setShowConfig(!showConfig)}
                    className="text-default-500"
                >
                    {showConfig ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                </Button>

                <div className="flex-1">
                    <Input 
                        value={urlInput}
                        onValueChange={(val) => { setUrlInput(val); setIsUrlDirty(true); }}
                        onKeyDown={(e) => e.key === 'Enter' && executeQuery()}
                        size="sm"
                        radius="md"
                        variant="flat"
                        placeholder="https://api.example.com/odata/..."
                        startContent={
                            <Chip size="sm" color="primary" variant="flat" classNames={{ base: "h-5", content: "px-1 text-[10px] font-bold" }}>GET</Chip>
                        }
                        endContent={
                            <div className="flex items-center gap-1">
                                <Tooltip content="Copy URL">
                                    <Button isIconOnly size="sm" variant="light" className="h-6 w-6 min-w-4" onPress={copyToClipboard}>
                                        <Copy className="w-3.5 h-3.5 text-default-400" />
                                    </Button>
                                </Tooltip>
                                <Divider orientation="vertical" className="h-4" />
                                <Tooltip content="Open in New Tab">
                                    <Button isIconOnly size="sm" variant="light" className="h-6 w-6 min-w-4" onPress={() => window.open(urlInput, '_blank')}>
                                        <ExternalLink className="w-3.5 h-3.5 text-default-400" />
                                    </Button>
                                </Tooltip>
                            </div>
                        }
                        classNames={{
                            input: "font-mono text-small",
                            inputWrapper: "bg-default-100 hover:bg-default-200 transition-colors"
                        }}
                    />
                </div>

                <Button 
                    color="primary" 
                    isLoading={loading}
                    onPress={() => executeQuery()}
                    startContent={!loading && <Play className="w-4 h-4 fill-current" />}
                    className="font-semibold shadow-md shadow-primary/20"
                >
                    Run
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden p-4">
                <Card className="flex-1 w-full flex flex-col overflow-hidden border border-divider shadow-sm" shadow="none">
                    
                    {/* Tabs Header */}
                    <div className="border-b border-divider flex items-center px-4 justify-between bg-background shrink-0 h-12">
                        <Tabs 
                            aria-label="Result View" 
                            selectedKey={activeTab}
                            onSelectionChange={(k) => setActiveTab(k as TabType)}
                            variant="underlined"
                            color="primary"
                            classNames={{
                                tabList: "gap-6 w-full relative p-0 border-b border-divider border-none",
                                cursor: "w-full bg-primary",
                                tab: "max-w-fit px-0 h-12",
                                tabContent: "group-data-[selected=true]:text-primary font-medium"
                            }}
                        >
                            <Tab 
                                key="table" 
                                title={
                                    <div className="flex items-center space-x-2">
                                        <TableIcon className="w-4 h-4" />
                                        <span>Table</span>
                                    </div>
                                }
                            />
                            <Tab 
                                key="json" 
                                title={
                                    <div className="flex items-center space-x-2">
                                        <FileJson className="w-4 h-4" />
                                        <span>JSON</span>
                                    </div>
                                }
                            />
                            <Tab 
                                key="xml" 
                                title={
                                    <div className="flex items-center space-x-2">
                                        <FileCode className="w-4 h-4" />
                                        <span>XML</span>
                                    </div>
                                }
                            />
                        </Tabs>

                        {resultData && resultData['@odata.count'] && (
                            <Chip 
                                size="sm" 
                                variant="flat" 
                                color="success" 
                                startContent={<Zap className="w-3 h-3 ml-1" />}
                                className="font-mono"
                            >
                                {resultData['@odata.count']} records
                            </Chip>
                        )}
                    </div>

                    {/* Viewport */}
                    <div className="flex-1 overflow-hidden relative bg-content1">
                        {error && (
                            <div className="absolute top-4 left-4 right-4 z-20 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg text-danger text-sm flex items-start gap-3 shadow-lg">
                                <X className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="font-mono break-all flex-1">{error}</div>
                                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => setError(null)}><X className="w-4 h-4"/></Button>
                            </div>
                        )}

                        {!resultData && !resultXml && !loading && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-default-400 select-none">
                                <div className="w-16 h-16 rounded-2xl bg-default-100 flex items-center justify-center mb-4 border border-divider">
                                    <Settings2 className="w-8 h-8 opacity-40" />
                                </div>
                                <p className="text-small font-medium">配置参数并点击运行</p>
                            </div>
                        )}

                        <div className="w-full h-full overflow-hidden">
                            {activeTab === 'json' && resultData && <div className="h-full w-full bg-[#1e1e1e]"><JsonNode value={resultData} theme={theme} /></div>}
                            
                            {activeTab === 'xml' && resultXml && <div className="h-full w-full bg-[#1e1e1e]"><XmlViewer xmlString={resultXml} theme={theme} /></div>}
                            
                            {activeTab === 'table' && resultData && (
                                <div className="h-full flex flex-col">
                                    {drillStack.length > 0 && (
                                        <div className="flex items-center gap-2 p-2 bg-default-50 border-b border-divider text-tiny shrink-0 sticky top-0 z-20">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => setDrillStack([])} className="h-6 w-6">
                                                <ArrowLeft className="w-3.5 h-3.5" />
                                            </Button>
                                            <span className="text-default-500">Root</span>
                                            {drillStack.map((item, idx) => (
                                                <React.Fragment key={idx}>
                                                    <ChevronRight className="w-3.5 h-3.5 text-default-400" />
                                                    <Chip size="sm" variant="flat" radius="sm" classNames={{ content: "px-1 max-w-[150px] truncate" }}>
                                                        {item.title}
                                                    </Chip>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-auto bg-background">
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
                </Card>
            </div>
        </div>
    </div>
  );
};

export default QueryBuilder;