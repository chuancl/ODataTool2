import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Layers, ArrowRight, RefreshCw, Code, Database, AlertCircle, List, Wand2, Moon, Sun } from 'lucide-react';
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
    <div className="flex flex-col h-screen text-text-main bg-canvas font-sans transition-all duration-300">
      {/* 顶部栏 */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-border px-8 flex items-center justify-between shadow-sm z-10 h-16 shrink-0">
        <div className="flex items-center gap-4">
            <div className="bg-brand w-10 h-10 flex items-center justify-center rounded-xl text-brand-fg shadow-lg shadow-indigo-500/20">
                <Database className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
                <h1 className="font-extrabold text-lg tracking-tight text-text-main">OData Visualizer</h1>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand/10 text-brand font-bold uppercase tracking-widest">Metadata</span>
                    <p className="text-[10px] text-text-muted truncate max-w-md font-mono opacity-60" title={state.url}>
                        {state.url || 'Local Metadata File'}
                    </p>
                </div>
            </div>
        </div>

        {/* View Switcher - 现代切换器 */}
        {!state.isLoading && !state.error && (
            <div className="bg-surface-hover p-1 rounded-xl flex items-center border border-border/50">
                <button 
                    onClick={() => setViewMode('details')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'details' ? 'bg-surface text-brand shadow-sm scale-[1.02]' : 'text-text-muted hover:text-text-main'}`}
                >
                    <List className="w-4 h-4" />
                    Schema 视图
                </button>
                <button 
                    onClick={() => setViewMode('query')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'query' ? 'bg-surface text-brand shadow-sm scale-[1.02]' : 'text-text-muted hover:text-text-main'}`}
                >
                    <Wand2 className="w-4 h-4" />
                    查询构建
                </button>
            </div>
        )}

        <div className="flex items-center gap-3">
            <button 
                onClick={cycleTheme} 
                className="w-10 h-10 flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-brand rounded-xl transition-all border border-transparent hover:border-border"
            >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button 
                onClick={() => window.location.reload()} 
                className="w-10 h-10 flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-brand rounded-xl transition-all border border-transparent hover:border-border"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full">
        {state.isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted bg-canvas z-20">
                <div className="w-10 h-10 border-4 border-surface-hover rounded-full border-t-brand animate-spin mb-4"></div>
                <p className="font-bold text-xs tracking-widest uppercase opacity-60">解析中...</p>
            </div>
        )}

        {state.error && (
             <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-canvas">
                <div className="bg-surface p-10 rounded-3xl shadow-2xl border border-red-500/10 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="font-black text-xl text-text-main mb-3">发生了错误</h2>
                    <p className="text-text-muted mb-8 text-sm leading-relaxed">{state.error}</p>
                    <button onClick={() => window.location.reload()} className="btn-primary w-full justify-center">重新尝试</button>
                </div>
            </div>
        )}

        {!state.isLoading && !state.error && state.schema && (
            <>
                {viewMode === 'details' ? (
                     <div className="flex w-full h-full overflow-hidden">
                        {/* 左侧列表 */}
                        <div className="w-72 bg-surface/50 border-r border-border overflow-y-auto flex flex-col z-0 shrink-0">
                            <div className="p-6 border-b border-border bg-canvas/30 sticky top-0 backdrop-blur-md z-10">
                                <h2 className="font-black text-[10px] text-text-muted uppercase tracking-[0.2em] flex items-center justify-between">
                                    <span>实体列表</span>
                                    <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full text-[10px]">{state.schema.entities.length}</span>
                                </h2>
                            </div>
                            <ul className="flex-1 py-4 px-3 space-y-1">
                                {state.schema.entities.map((entity, idx) => (
                                    <li key={idx}>
                                        <button
                                            onClick={() => setSelectedEntity(entity.name)}
                                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                                                selectedEntity === entity.name 
                                                ? 'bg-brand text-brand-fg shadow-lg shadow-indigo-500/30' 
                                                : 'text-text-muted hover:bg-surface-hover hover:text-text-main'
                                            }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${selectedEntity === entity.name ? 'bg-white' : 'bg-brand/30'}`}></div>
                                            <span className="text-xs font-bold truncate">{entity.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 详情内容 */}
                        <div className="flex-1 bg-canvas overflow-y-auto p-12">
                            {currentEntity ? (
                                <div className="max-w-5xl mx-auto space-y-10">
                                    <div className="flex items-end justify-between border-b border-border pb-8">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{state.schema.namespace}</span>
                                            </div>
                                            <h2 className="text-4xl font-black text-text-main tracking-tight">{currentEntity.name}</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {currentEntity.keys.map(k => (
                                                <span key={k} className="bg-brand/5 text-brand text-[10px] px-3 py-1.5 rounded-lg border border-brand/20 font-black uppercase flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                                                    主键: {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                                        <div className="xl:col-span-2 space-y-4">
                                            <h3 className="text-sm font-black text-text-main flex items-center gap-2 px-2 uppercase tracking-wider">
                                                <Code className="w-4 h-4 text-brand" /> 属性字段 (Properties)
                                            </h3>
                                            <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
                                                <table className="w-full text-xs text-left border-collapse">
                                                    <thead className="bg-surface-hover/50 text-text-muted border-b border-border">
                                                        <tr>
                                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">字段名</th>
                                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">类型</th>
                                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">可为空</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {currentEntity.properties.map((p, i) => (
                                                            <tr key={i} className="hover:bg-surface-hover/30 transition-colors">
                                                                <td className="px-6 py-4 font-bold text-text-main flex items-center gap-2">
                                                                    {p.name} {currentEntity.keys.includes(p.name) && <span className="text-brand">🔑</span>}
                                                                </td>
                                                                <td className="px-6 py-4"><span className="px-2 py-0.5 bg-canvas rounded-md border border-border font-mono text-[10px] text-text-muted">{p.type}</span></td>
                                                                <td className="px-6 py-4 text-text-muted">{p.nullable ? 'Yes' : 'No'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-text-main flex items-center gap-2 px-2 uppercase tracking-wider">
                                                <ArrowRight className="w-4 h-4 text-brand" /> 导航关联 (Navigation)
                                            </h3>
                                            <div className="space-y-3">
                                                {currentEntity.navigationProperties.map((nav, i) => (
                                                    <div key={i} className="p-4 bg-surface rounded-2xl border border-border flex flex-col gap-2 hover:border-brand/30 transition-all group">
                                                        <span className="font-black text-brand text-xs">{nav.name}</span>
                                                        <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono bg-canvas p-2 rounded-lg">
                                                            <span className="shrink-0 opacity-50">Target:</span>
                                                            <span className="truncate">{nav.type}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {currentEntity.navigationProperties.length === 0 && (
                                                    <div className="p-10 border-2 border-dashed border-border rounded-3xl text-center text-text-muted text-xs italic opacity-50">
                                                        无关联属性
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-text-muted/40">
                                    <Layers className="w-20 h-20 mb-4 stroke-[1px]" />
                                    <p className="font-bold tracking-widest uppercase text-xs">从左侧选择一个实体以查看详情</p>
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