import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Layers, ArrowRight, RefreshCw, Code, Database, AlertCircle, List, Wand2, Moon, Sun, Coffee } from 'lucide-react';
import { ViewerState } from '../../types';
import { parseODataMetadata, inferMetadataUrl } from '../../services/odataService';
import QueryBuilder from '../../components/QueryBuilder';
import '../../assets/main.css';

type Theme = 'light' | 'dark' | 'warm';

const ODataViewerApp: React.FC = () => {
  const [state, setState] = useState<ViewerState>({
    sourceType: 'raw',
    isLoading: true
  });
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'query'>('details');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Restore theme from localStorage
    const savedTheme = localStorage.getItem('odata-viewer-theme') as Theme;
    if (savedTheme) {
        setTheme(savedTheme);
    }
    init();
  }, []);

  // Update theme attribute on root
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
      const themes: Theme[] = ['light', 'dark', 'warm'];
      const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
      setTheme(themes[nextIdx]);
  };

  const getThemeIcon = () => {
      switch(theme) {
          case 'dark': return <Moon className="w-4 h-4" />;
          case 'warm': return <Coffee className="w-4 h-4" />;
          default: return <Sun className="w-4 h-4" />;
      }
  };

  return (
    <div className="flex flex-col h-screen text-text-main bg-canvas font-sans transition-colors duration-200">
      {/* 顶部栏 */}
      <header className="bg-surface border-b border-border px-6 py-2 flex items-center justify-between shadow-sm z-10 h-14 shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-3">
            <div className="bg-brand p-1.5 rounded-md text-brand-fg shadow-sm">
                <Database className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
                <h1 className="font-bold text-base leading-tight text-text-main">OData Visualizer</h1>
                <p className="text-[10px] text-text-muted truncate max-w-xl font-mono opacity-80" title={state.url}>
                    {state.url || 'Local File'}
                </p>
            </div>
        </div>

        {/* View Switcher */}
        {!state.isLoading && !state.error && (
            <div className="bg-surface-hover p-1 rounded-lg flex items-center border border-border">
                <button 
                    onClick={() => setViewMode('details')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'details' ? 'bg-surface text-brand shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                    <List className="w-3.5 h-3.5" />
                    Schema
                </button>
                <button 
                    onClick={() => setViewMode('query')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'query' ? 'bg-surface text-brand shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                    <Wand2 className="w-3.5 h-3.5" />
                    Query Builder
                </button>
            </div>
        )}

        <div className="flex gap-2">
            <button 
                onClick={cycleTheme} 
                className="p-2 text-text-muted hover:bg-surface-hover hover:text-brand rounded-full transition"
                title={`Switch Theme (Current: ${theme})`}
            >
                {getThemeIcon()}
            </button>
            <button 
                onClick={() => window.location.reload()} 
                className="p-2 text-text-muted hover:bg-surface-hover hover:text-brand rounded-full transition"
                title="Reload"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full">
        
        {state.isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted bg-canvas z-20">
                <div className="w-8 h-8 border-4 border-surface-hover rounded-full border-t-brand animate-spin"></div>
                <p className="mt-4 font-medium text-sm">Parsing metadata...</p>
            </div>
        )}

        {state.error && (
             <div className="w-full h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
                <div className="bg-surface p-8 rounded-xl shadow-lg border border-red-200 max-w-lg w-full text-center">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="font-bold text-lg text-text-main mb-2">Error Occurred</h2>
                    <p className="text-text-muted mb-6 text-sm whitespace-pre-line">{state.error}</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-surface-hover hover:bg-border rounded text-sm font-medium text-text-main">Try Again</button>
                </div>
            </div>
        )}

        {!state.isLoading && !state.error && state.schema && (
            <>
                {viewMode === 'details' ? (
                     <div className="flex w-full h-full overflow-hidden">
                        {/* 左侧列表 */}
                        <div className="w-64 bg-surface border-r border-border overflow-y-auto flex flex-col z-0 flex-shrink-0">
                                <div className="p-3 border-b border-border bg-canvas/80 sticky top-0 backdrop-blur-sm z-10">
                                <h2 className="font-bold text-[10px] text-text-muted uppercase tracking-wider flex items-center justify-between">
                                    <span>Entities</span>
                                    <span className="bg-surface-hover text-text-muted px-1.5 rounded-full border border-border">{state.schema.entities.length}</span>
                                </h2>
                            </div>
                            <ul className="flex-1 py-1">
                                {state.schema.entities.map((entity, idx) => (
                                    <li key={idx}>
                                        <button
                                            onClick={() => setSelectedEntity(entity.name)}
                                            className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors border-l-2 ${
                                                selectedEntity === entity.name 
                                                ? 'bg-brand/5 border-brand text-brand' 
                                                : 'border-transparent text-text-muted hover:bg-surface-hover hover:text-text-main'
                                            }`}
                                        >
                                            <span className="text-xs font-medium truncate">{entity.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 详情内容 */}
                        <div className="flex-1 bg-surface overflow-y-auto p-8">
                            {currentEntity ? (
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="flex items-start justify-between border-b border-border pb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-text-main">{currentEntity.name}</h2>
                                            <p className="text-text-muted text-xs mt-1 font-mono">{state.schema.namespace}.{currentEntity.name}</p>
                                        </div>
                                            <div className="flex flex-wrap gap-2">
                                            {currentEntity.keys.map(k => (
                                                <span key={k} className="bg-brand/5 text-brand text-xs px-2 py-1 rounded border border-brand/20 font-mono flex items-center gap-1">
                                                    Key: {k}
                                                </span>
                                            ))}
                                            </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
                                                <Code className="w-4 h-4 text-text-muted" /> Properties
                                            </h3>
                                            <table className="w-full text-xs text-left border-collapse">
                                                <thead className="bg-canvas text-text-muted">
                                                    <tr>
                                                        <th className="px-3 py-2 border border-border font-semibold">Name</th>
                                                        <th className="px-3 py-2 border border-border font-semibold">Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentEntity.properties.map((p, i) => (
                                                        <tr key={i} className="hover:bg-surface-hover">
                                                            <td className="px-3 py-2 border border-border font-mono text-text-main">
                                                                {p.name} {currentEntity.keys.includes(p.name) && '🔑'}
                                                            </td>
                                                            <td className="px-3 py-2 border border-border text-text-muted">{p.type}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-text-muted" /> Navigation
                                            </h3>
                                            <div className="border border-border rounded-md overflow-hidden bg-surface">
                                                {currentEntity.navigationProperties.map((nav, i) => (
                                                    <div key={i} className="px-3 py-2 flex justify-between items-center hover:bg-surface-hover border-b border-border last:border-0 text-xs transition-colors">
                                                        <span className="font-medium text-brand">{nav.name}</span>
                                                        <div className="flex items-center gap-1 text-text-muted">
                                                            <ArrowRight className="w-3 h-3" />
                                                            <span className="font-mono">{nav.type}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {currentEntity.navigationProperties.length === 0 && <div className="p-3 text-center text-text-muted text-xs italic">No relationships</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-text-muted">
                                    <p>Select an entity from the list</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Query Builder View
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