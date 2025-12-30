import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Layers, ArrowRight, RefreshCw, Code, Database, AlertCircle, List, Wand2, Moon, Sun, Box } from 'lucide-react';
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('odata-viewer-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }
    init();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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
    <div className="flex flex-col h-screen text-main bg-app font-sans transition-colors duration-200">
      {/* 顶部栏 - Ultra Minimal */}
      <header className="bg-app/80 backdrop-blur-md border-b border-base px-6 flex items-center justify-between z-20 h-14 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[rgb(var(--c-accent))] to-[rgb(var(--c-accent-hover))] rounded-lg flex items-center justify-center text-white shadow-sm">
                <Database className="w-4 h-4" />
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="font-bold text-sm tracking-tight text-main leading-none mb-1">OData Visualizer</h1>
                {state.url && (
                    <p className="text-[10px] text-muted font-mono truncate max-w-xs opacity-80 leading-none">
                        {state.url.replace(/^https?:\/\//, '')}
                    </p>
                )}
            </div>
        </div>

        {/* View Switcher - Segmented Control */}
        {!state.isLoading && !state.error && (
            <div className="bg-hover p-1 rounded-lg flex items-center border border-base">
                <button 
                    onClick={() => setViewMode('details')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'details' ? 'bg-app text-main shadow-sm' : 'text-muted hover:text-sec'}`}
                >
                    <List className="w-3.5 h-3.5" />
                    Schema
                </button>
                <div className="w-px h-4 bg-base mx-1 opacity-50"></div>
                <button 
                    onClick={() => setViewMode('query')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'query' ? 'bg-app text-main shadow-sm' : 'text-muted hover:text-sec'}`}
                >
                    <Wand2 className="w-3.5 h-3.5" />
                    Explorer
                </button>
            </div>
        )}

        <div className="flex items-center gap-2">
            <button 
                onClick={cycleTheme} 
                className="w-8 h-8 flex items-center justify-center text-muted hover:bg-hover hover:text-main rounded-md transition-all"
                title="Toggle Theme"
            >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button 
                onClick={() => window.location.reload()} 
                className="w-8 h-8 flex items-center justify-center text-muted hover:bg-hover hover:text-main rounded-md transition-all"
                title="Refresh"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full bg-app">
        {state.isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted bg-app z-30">
                <div className="w-8 h-8 border-2 border-hover rounded-full border-t-[rgb(var(--c-accent))] animate-spin mb-4"></div>
                <p className="font-medium text-xs tracking-wider opacity-60">LOADING METADATA...</p>
            </div>
        )}

        {state.error && (
             <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-app">
                <div className="bg-panel p-8 rounded-2xl shadow-xl border border-base max-w-md w-full text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="font-bold text-lg text-main mb-2">Failed to Load</h2>
                    <p className="text-muted mb-6 text-sm leading-relaxed">{state.error}</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-main text-app rounded-lg text-sm font-medium hover:opacity-90">Retry</button>
                </div>
            </div>
        )}

        {!state.isLoading && !state.error && state.schema && (
            <>
                {viewMode === 'details' ? (
                     <div className="flex w-full h-full overflow-hidden">
                        {/* 左侧列表 - Modern Navigation Sidebar */}
                        <div className="w-64 bg-sidebar border-r border-base overflow-y-auto flex flex-col shrink-0 custom-scrollbar">
                            <div className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10 flex justify-between items-center">
                                Entities
                                <span className="bg-base px-1.5 rounded text-sec">{state.schema.entities.length}</span>
                            </div>
                            <div className="px-2 pb-4 space-y-0.5">
                                {state.schema.entities.map((entity, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedEntity(entity.name)}
                                        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-all text-xs group ${
                                            selectedEntity === entity.name 
                                            ? 'bg-white dark:bg-white/10 text-main shadow-sm font-semibold' 
                                            : 'text-sec hover:bg-hover hover:text-main'
                                        }`}
                                    >
                                        <Box className={`w-3.5 h-3.5 ${selectedEntity === entity.name ? 'text-[rgb(var(--c-accent))]' : 'text-muted group-hover:text-sec'}`} />
                                        <span className="truncate">{entity.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 详情内容 */}
                        <div className="flex-1 bg-app overflow-y-auto p-8 custom-scrollbar">
                            {currentEntity ? (
                                <div className="max-w-4xl mx-auto pb-10">
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 text-xs text-muted mb-2 font-mono">
                                            <span>{state.schema.namespace}</span>
                                            <span>/</span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <h2 className="text-3xl font-bold text-main tracking-tight">{currentEntity.name}</h2>
                                            <div className="flex gap-2">
                                                {currentEntity.keys.map(k => (
                                                    <span key={k} className="bg-[rgb(var(--c-accent))]/10 text-[rgb(var(--c-accent))] text-[10px] px-2 py-1 rounded-md font-bold uppercase border border-[rgb(var(--c-accent))]/20">
                                                        PK: {k}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Properties */}
                                        <div className="lg:col-span-2">
                                            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Code className="w-3.5 h-3.5" /> Properties
                                            </h3>
                                            <div className="bg-panel rounded-xl border border-base shadow-sm overflow-hidden">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-hover/50 text-muted border-b border-base">
                                                        <tr>
                                                            <th className="px-5 py-3 font-semibold w-1/3">Name</th>
                                                            <th className="px-5 py-3 font-semibold w-1/3">Type</th>
                                                            <th className="px-5 py-3 font-semibold text-right">Nullable</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-base">
                                                        {currentEntity.properties.map((p, i) => (
                                                            <tr key={i} className="group hover:bg-hover/30 transition-colors">
                                                                <td className="px-5 py-3 font-medium text-main flex items-center gap-2">
                                                                    {p.name} {currentEntity.keys.includes(p.name) && <span className="text-[rgb(var(--c-accent))]" title="Key">🔑</span>}
                                                                </td>
                                                                <td className="px-5 py-3"><code className="px-1.5 py-0.5 bg-hover rounded text-sec font-mono text-[11px]">{p.type}</code></td>
                                                                <td className="px-5 py-3 text-right text-muted">{p.nullable ? 'Yes' : 'No'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        
                                        {/* Relations */}
                                        <div>
                                            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <ArrowRight className="w-3.5 h-3.5" /> Navigation
                                            </h3>
                                            <div className="space-y-2">
                                                {currentEntity.navigationProperties.map((nav, i) => (
                                                    <div key={i} className="p-3 bg-panel rounded-lg border border-base flex flex-col gap-1 hover:border-[rgb(var(--c-accent))] transition-colors group cursor-default shadow-sm">
                                                        <span className="font-semibold text-main text-xs group-hover:text-[rgb(var(--c-accent))] transition-colors">{nav.name}</span>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono">
                                                            <ArrowRight className="w-3 h-3 opacity-50" />
                                                            <span className="truncate">{nav.type}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {currentEntity.navigationProperties.length === 0 && (
                                                    <div className="p-6 border border-dashed border-base rounded-lg text-center text-muted text-xs bg-hover/30">
                                                        No navigation properties
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted/50">
                                    <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mb-4">
                                        <Layers className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p className="font-medium">Select an entity to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full relative overflow-hidden">
                        <QueryBuilder schema={state.schema} metadataUrl={state.url || ''} />
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ODataViewerApp />
  </React.StrictMode>
);