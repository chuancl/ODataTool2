import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { 
    HeroUIProvider,
    Navbar, 
    NavbarBrand, 
    NavbarContent, 
    Tabs, 
    Tab,
    Button,
    Spinner,
    Card, 
    CardBody,
    Listbox, 
    ListboxItem,
    ScrollShadow,
    Chip,
} from '@heroui/react';
import { 
    Database, 
    RefreshCw, 
    Moon, 
    Sun, 
    AlertCircle, 
    Box,
    Layers,
    Code,
    ArrowRight
} from 'lucide-react';
import { ViewerState } from '../../types';
import { parseODataMetadata, inferMetadataUrl } from '../../services/odataService';
import QueryBuilder from '../../components/QueryBuilder';
import '../../assets/main.css';

type Theme = 'light' | 'dark';

const ODataViewerApp: React.FC = () => {
  const [state, setState] = useState<ViewerState>({
    sourceType: 'raw',
    isLoading: true
  });
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'query'>('details');
  const [theme, setTheme] = useState<Theme>('light');

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('odata-viewer-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }
    init();
  }, []);

  // 切换主题 class
  useEffect(() => {
    const root = document.documentElement;
    // 移除之前的类，确保干净切换
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
    localStorage.setItem('odata-viewer-theme', theme);
  }, [theme]);

  const init = async () => {
    const params = new URLSearchParams(window.location.search);
    const sourceType = params.get('sourceType') as any || 'url';
    let url = params.get('url') || '';
    
    setState(prev => ({ ...prev, sourceType, url, isLoading: true }));

    try {
      let content = '';
      
      if (sourceType === 'storage') {
        const data = await browser.storage.local.get('temp_odata_content');
        content = data.temp_odata_content as string;
        parseAndSet(content);
      } else if (sourceType === 'url' && url) {
        let fetchUrl = url;
        
        if (!url.toLowerCase().includes('$metadata')) {
             const metadataUrl = inferMetadataUrl(url);
             try {
                 const res = await fetch(metadataUrl);
                 if (res.ok) {
                     const text = await res.text();
                     if (text.includes('Edmx') || text.includes('Schema')) {
                         fetchUrl = metadataUrl;
                         content = text;
                         setState(prev => ({ ...prev, url: metadataUrl }));
                     }
                 }
             } catch (e) {
                 console.warn("Failed to fetch inferred metadata");
             }
        }

        if (!content) {
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            content = await res.text();
        }

        parseAndSet(content);
      } else {
        setState(prev => ({ ...prev, isLoading: false, error: "无效的来源或 URL" }));
      }
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: `请求失败: ${err.message}\n请检查该 OData 服务是否允许跨域 (CORS)。` }));
    }
  };

  const parseAndSet = (content: string) => {
      try {
        const schema = parseODataMetadata(content);
        if (schema.entities.length > 0) {
            setSelectedEntity(schema.entities[0].name);
        }
        setState(prev => ({ ...prev, isLoading: false, schema, content, error: undefined }));
      } catch (e: any) {
          setState(prev => ({ ...prev, isLoading: false, error: `解析失败: ${e.message}。` }));
      }
  };

  const currentEntity = state.schema?.entities.find(e => e.name === selectedEntity);

  const cycleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <HeroUIProvider>
        {/* 外层包裹 div 显式应用 background 和 foreground，确保 CSS 变量生效 */}
        <div className={`flex flex-col h-screen w-full bg-background text-foreground transition-colors duration-200 overflow-hidden ${theme}`}>
        {/* 顶部导航栏 */}
        <Navbar isBordered maxWidth="full" height="3.5rem" classNames={{ wrapper: "px-4" }}>
            <NavbarBrand className="gap-3 max-w-fit">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/40">
                    <Database className="w-4 h-4" />
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="font-bold text-small leading-none">OData Visualizer</h1>
                    {state.url && (
                        <p className="text-[10px] text-default-400 font-mono truncate max-w-[200px] opacity-80 leading-none mt-1">
                            {state.url.replace(/^https?:\/\//, '')}
                        </p>
                    )}
                </div>
            </NavbarBrand>

            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                {!state.isLoading && !state.error && (
                    <Tabs 
                        selectedKey={viewMode} 
                        onSelectionChange={(k) => setViewMode(k as any)}
                        radius="full" 
                        size="sm"
                        color="primary"
                        variant="solid"
                        classNames={{
                            tabList: "bg-default-100/50 p-1 border border-default-200",
                            cursor: "shadow-sm",
                        }}
                    >
                        <Tab key="details" title="Schema" />
                        <Tab key="query" title="Explorer" />
                    </Tabs>
                )}
            </NavbarContent>

            <NavbarContent justify="end">
                <Button isIconOnly variant="light" onPress={cycleTheme} radius="full">
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </Button>
                <Button isIconOnly variant="light" onPress={() => window.location.reload()} radius="full">
                    <RefreshCw className="w-5 h-5" />
                </Button>
            </NavbarContent>
        </Navbar>

        {/* 主体内容区 */}
        <main className="flex-1 flex overflow-hidden relative w-full h-full">
            {state.isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-50">
                    <Spinner size="lg" color="primary" label="Loading Metadata..." />
                </div>
            )}

            {state.error && (
                <div className="w-full h-full flex items-center justify-center p-8">
                    <Card className="max-w-md w-full border-none shadow-xl bg-danger-50 dark:bg-danger-900/20">
                        <CardBody className="flex flex-col items-center text-center p-8">
                            <AlertCircle className="w-12 h-12 text-danger mb-4" />
                            <h2 className="text-xl font-bold text-danger mb-2">加载失败</h2>
                            <p className="text-default-500 text-small mb-6">{state.error}</p>
                            <Button color="danger" variant="flat" onPress={() => window.location.reload()}>
                                重试
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            )}

            {!state.isLoading && !state.error && state.schema && (
                <>
                    {viewMode === 'details' ? (
                        <div className="flex w-full h-full">
                            {/* 左侧实体列表 */}
                            <div className="w-64 border-r border-divider bg-default-50 flex flex-col shrink-0">
                                <div className="px-4 py-3 flex justify-between items-center border-b border-divider bg-background/50 backdrop-blur sticky top-0 z-10">
                                    <span className="text-tiny font-bold text-default-500 uppercase">Entities</span>
                                    <Chip size="sm" variant="flat" color="default">{state.schema.entities.length}</Chip>
                                </div>
                                <ScrollShadow className="flex-1 p-2">
                                    <Listbox 
                                        aria-label="Entities"
                                        variant="flat"
                                        disallowEmptySelection
                                        selectionMode="single"
                                        selectedKeys={selectedEntity ? new Set([selectedEntity]) : new Set()}
                                        onSelectionChange={(keys) => setSelectedEntity(Array.from(keys)[0] as string)}
                                        classNames={{
                                            list: "gap-1"
                                        }}
                                    >
                                        {state.schema.entities.map((entity) => (
                                            <ListboxItem 
                                                key={entity.name} 
                                                startContent={<Box className={selectedEntity === entity.name ? "text-primary w-4 h-4" : "text-default-400 w-4 h-4"} />}
                                                className={selectedEntity === entity.name ? "bg-primary-50 text-primary font-medium" : "text-default-600"}
                                            >
                                                {entity.name}
                                            </ListboxItem>
                                        ))}
                                    </Listbox>
                                </ScrollShadow>
                            </div>

                            {/* 右侧详情 */}
                            <ScrollShadow className="flex-1 bg-background p-8">
                                {currentEntity ? (
                                    <div className="max-w-5xl mx-auto space-y-8 pb-10">
                                        <div>
                                            <div className="flex items-center gap-2 text-tiny text-default-400 mb-2 font-mono">
                                                <span>{state.schema.namespace}</span>
                                                <span>/</span>
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <h2 className="text-3xl font-bold tracking-tight">{currentEntity.name}</h2>
                                                <div className="flex gap-2">
                                                    {currentEntity.keys.map(k => (
                                                        <Chip key={k} color="primary" variant="flat" size="sm" startContent={<span className="ml-1 text-[10px]">🔑</span>}>
                                                            PK: {k}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* 属性表格 */}
                                            <Card className="lg:col-span-2 border border-divider shadow-sm" shadow="none">
                                                <CardBody className="p-0">
                                                    <div className="px-4 py-3 border-b border-divider bg-default-50 flex items-center gap-2">
                                                        <Code className="w-4 h-4 text-default-500" />
                                                        <span className="text-small font-bold text-default-600 uppercase">Properties</span>
                                                    </div>
                                                    <table className="w-full text-small text-left odata-table">
                                                        <thead>
                                                            <tr>
                                                                <th className="!bg-background w-1/3">Name</th>
                                                                <th className="!bg-background w-1/3">Type</th>
                                                                <th className="!bg-background text-right">Nullable</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {currentEntity.properties.map((p, i) => (
                                                                <tr key={i}>
                                                                    <td className="font-medium">
                                                                        <div className="flex items-center gap-2">
                                                                            {p.name}
                                                                            {currentEntity.keys.includes(p.name) && <span title="Primary Key">🔑</span>}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <Chip size="sm" variant="flat" radius="sm" classNames={{ content: "font-mono text-[10px]" }}>{p.type}</Chip>
                                                                    </td>
                                                                    <td className="text-right text-default-400">{p.nullable ? 'Yes' : 'No'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </CardBody>
                                            </Card>

                                            {/* 导航属性 */}
                                            <Card className="h-fit border border-divider shadow-sm" shadow="none">
                                                <CardBody className="p-0">
                                                    <div className="px-4 py-3 border-b border-divider bg-default-50 flex items-center gap-2">
                                                        <ArrowRight className="w-4 h-4 text-default-500" />
                                                        <span className="text-small font-bold text-default-600 uppercase">Navigation</span>
                                                    </div>
                                                    <div className="p-2 space-y-1">
                                                        {currentEntity.navigationProperties.map((nav, i) => (
                                                            <div key={i} className="group p-3 rounded-lg hover:bg-default-100 transition-colors cursor-default border border-transparent hover:border-default-200">
                                                                <div className="font-medium text-small group-hover:text-primary transition-colors">{nav.name}</div>
                                                                <div className="flex items-center gap-1.5 text-tiny text-default-400 font-mono mt-1">
                                                                    <ArrowRight className="w-3 h-3 opacity-50" />
                                                                    <span className="truncate">{nav.type}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {currentEntity.navigationProperties.length === 0 && (
                                                            <div className="p-8 text-center text-default-400 text-small italic">
                                                                No navigation properties
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-default-400">
                                        <div className="w-20 h-20 bg-default-100 rounded-full flex items-center justify-center mb-4">
                                            <Layers className="w-10 h-10 opacity-50" />
                                        </div>
                                        <p className="font-medium">选择左侧实体查看详情</p>
                                    </div>
                                )}
                            </ScrollShadow>
                        </div>
                    ) : (
                        <div className="w-full h-full overflow-hidden">
                            <QueryBuilder schema={state.schema} metadataUrl={state.url || ''} theme={theme} />
                        </div>
                    )}
                </>
            )}
        </main>
        </div>
    </HeroUIProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ODataViewerApp />
  </React.StrictMode>
);