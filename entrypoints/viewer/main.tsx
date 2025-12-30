import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Layers, List, Wand2, Moon, Sun, Database, Code2 } from 'lucide-react';
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
    if (savedTheme) setTheme(savedTheme);
    init();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('odata-viewer-theme', theme);
  }, [theme]);

  const init = async () => {
    // ... (保持原有的初始化逻辑不变，只改 UI)
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
             } catch (e) { console.warn("Failed to fetch inferred metadata"); }
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
      setState(prev => ({ ...prev, isLoading: false, error: `请求失败: ${err.message}` }));
    }
  };

  const parseAndSet = (content: string) => {
      try {
        const schema = parseODataMetadata(content);
        if (schema.entities.length > 0) setSelectedEntity(schema.entities[0].name);
        setState(prev => ({ ...prev, isLoading: false, schema, content, error: undefined }));
      } catch (e: any) {
          setState(prev => ({ ...prev, isLoading: false, error: `解析失败: ${e.message}` }));
      }
  };

  const currentEntity = state.schema?.entities.find(e => e.name === selectedEntity);

  return (
    <div className="flex flex-col h-screen bg-canvas text-text-main font-sans overflow-hidden">
      {/* 极简顶部导航栏 (Toolbar Style) */}
      <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center text-white shadow-sm">
                <Database className="w-4 h-4" />
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="text-sm font-bold leading-none text-text-main">OData Visualizer</h1>
                <span className="text-[10px] text-text-muted font-mono mt-0.5 max-w-[300px] truncate" title={state.url}>
                    {state.url || 'Local Metadata'}
                </span>
            </div>
        </div>

        {!state.isLoading && !state.error && (
            <div className="flex bg-canvas p-0.5 rounded-lg border border-border">
                <button 
                    onClick={() => setViewMode('details')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'details' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand' : 'text-text-muted hover:text-text-main'}`}
                >
                    <List className="w-3.5 h-3.5" /> Schema
                </button>
                <button 
                    onClick={() => setViewMode('query')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'query' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand' : 'text-text-muted hover:text-text-main'}`}
                >
                    <Wand2 className="w-3.5 h-3.5" /> Query
                </button>
            </div>
        )}

        <div className="flex items-center gap-2">
            <button 
                onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition-colors"
            >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
        </div>
      </header>

      {/* 主工作区 */}
      <main className="flex-1 flex overflow-hidden relative">
        {state.isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-text-muted font-medium">Loading metadata...</p>
            </div>
        ) : state.error ? (
            <div className="m-auto max-w-md p-6 bg-surface border border-red-200 rounded-lg shadow-sm text-center">
                <p className="text-red-600 font-medium mb-2">Error Loading Data</p>
                <p className="text-xs text-text-muted mb-4">{state.error}</p>
                <button onClick={() => window.location.reload()} className="btn-secondary w-full">Retry</button>
            </div>
        ) : (
            <>
                {viewMode === 'details' ? (
                     <div className="flex w-full h-full">
                        {/* 左侧实体列表 */}
                        <div className="w-64 bg-surface-muted border-r border-border flex flex-col shrink-0">
                            <div className="h-9 px-3 border-b border-border flex items-center justify-between bg-surface-muted">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Entities</span>
                                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-text-sec">{state.schema?.entities.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                                {state.schema?.entities.map((entity) => (
                                    <button
                                        key={entity.name}
                                        onClick={() => setSelectedEntity(entity.name)}
                                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors truncate flex items-center gap-2 ${
                                            selectedEntity === entity.name 
                                            ? 'bg-brand/10 text-brand font-semibold' 
                                            : 'text-text-sec hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedEntity === entity.name ? 'bg-brand' : 'bg-slate-300'}`}></div>
                                        {entity.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 右侧详情 */}
                        <div className="flex-1 bg-surface overflow-y-auto p-8">
                            {currentEntity ? (
                                <div className="max-w-4xl mx-auto">
                                    <div className="mb-6 flex items-baseline justify-between border-b border-border pb-4">
                                        <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                                            <Layers className="w-6 h-6 text-brand" />
                                            {currentEntity.name}
                                        </h2>
                                        <span className="text-xs font-mono text-text-muted">{state.schema?.namespace}</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="col-span-2 space-y-3">
                                            <h3 className="text-xs font-bold text-text-sec uppercase tracking-wider flex items-center gap-2">
                                                <Code2 className="w-3.5 h-3.5" /> Properties
                                            </h3>
                                            <div className="border border-border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-surface-muted text-text-muted border-b border-border">
                                                        <tr>
                                                            <th className="px-4 py-2 font-medium">Name</th>
                                                            <th className="px-4 py-2 font-medium">Type</th>
                                                            <th className="px-4 py-2 font-medium text-right">Nullable</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border bg-surface">
                                                        {currentEntity.properties.map((p, i) => (
                                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                <td className="px-4 py-2 font-medium text-text-main flex items-center gap-1.5">
                                                                    {p.name} {currentEntity.keys.includes(p.name) && <span title="Primary Key" className="text-[10px] cursor-help">🔑</span>}
                                                                </td>
                                                                <td className="px-4 py-2 font-mono text-text-sec">{p.type}</td>
                                                                <td className="px-4 py-2 text-right text-text-muted">{p.nullable ? 'Yes' : '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                             <h3 className="text-xs font-bold text-text-sec uppercase tracking-wider flex items-center gap-2">
                                                <Database className="w-3.5 h-3.5" /> Relations
                                            </h3>
                                            <div className="space-y-2">
                                                {currentEntity.navigationProperties.map((nav, i) => (
                                                    <div key={i} className="p-3 border border-border rounded-lg bg-surface-muted hover:border-brand/30 transition-colors">
                                                        <div className="text-xs font-bold text-brand mb-1">{nav.name}</div>
                                                        <div className="text-[10px] font-mono text-text-muted break-all">{nav.type}</div>
                                                    </div>
                                                ))}
                                                {currentEntity.navigationProperties.length === 0 && (
                                                    <div className="text-xs text-text-muted italic p-2">No navigation properties</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                                    <Layers className="w-16 h-16 mb-2 stroke-1" />
                                    <p className="text-sm">Select an entity to view schema</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <QueryBuilder schema={state.schema!} metadataUrl={state.url || ''} />
                )}
            </>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ODataViewerApp />
  </React.StrictMode>
);