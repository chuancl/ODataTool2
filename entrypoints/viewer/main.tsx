import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Layers, List, PlayCircle, Moon, Sun, Database, Code2, Box } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'schema' | 'query'>('schema');
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
        // 如果给定的不是 metadata，尝试推断
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
             } catch (e) { console.warn("Inferred metadata fetch failed"); }
        }
        if (!content) {
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            content = await res.text();
        }
        parseAndSet(content);
      } else {
        setState(prev => ({ ...prev, isLoading: false, error: "Invalid source type" }));
      }
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: `Error: ${err.message}` }));
    }
  };

  const parseAndSet = (content: string) => {
      try {
        const schema = parseODataMetadata(content);
        if (schema.entities.length > 0) setSelectedEntity(schema.entities[0].name);
        setState(prev => ({ ...prev, isLoading: false, schema, content, error: undefined }));
      } catch (e: any) {
          setState(prev => ({ ...prev, isLoading: false, error: `Parse Error: ${e.message}` }));
      }
  };

  const currentEntity = state.schema?.entities.find(e => e.name === selectedEntity);

  // --- Components ---

  const Header = () => (
    <header className="h-12 flex items-center justify-between px-4 border-b shrink-0 z-30" 
            style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm">
                <Database className="w-4 h-4" />
            </div>
            <div>
                <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">OData Visualizer</h1>
                <p className="text-[10px] text-[var(--text-muted)] font-mono max-w-[400px] truncate" title={state.url}>
                    {state.url || 'Local File'}
                </p>
            </div>
        </div>

        {!state.isLoading && !state.error && (
            <div className="flex items-center bg-[var(--bg-app)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
                <button 
                    onClick={() => setViewMode('schema')}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${
                        viewMode === 'schema' 
                        ? 'bg-[var(--bg-panel)] text-[var(--accent-text)] shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <List className="w-3.5 h-3.5" /> Schema
                </button>
                <div className="w-px h-3 bg-[var(--border-strong)] mx-0.5"></div>
                <button 
                    onClick={() => setViewMode('query')}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${
                        viewMode === 'query' 
                        ? 'bg-[var(--bg-panel)] text-[var(--accent-text)] shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <PlayCircle className="w-3.5 h-3.5" /> Query Builder
                </button>
            </div>
        )}

        <div className="flex items-center">
            <button 
                onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
                className="p-2 rounded hover:bg-[var(--bg-app)] text-[var(--text-secondary)] transition-colors"
                title="Toggle Theme"
            >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
        </div>
    </header>
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-app)]">
      <Header />
      
      <main className="flex-1 flex overflow-hidden">
        {state.isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Parsing Metadata...</p>
            </div>
        ) : state.error ? (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-[var(--bg-panel)] border border-red-200 rounded-lg p-6 shadow-sm text-center">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Box className="w-6 h-6" />
                    </div>
                    <h3 className="text-red-600 font-semibold mb-2">Failed to Load</h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-6 font-mono break-all">{state.error}</p>
                    <button onClick={() => window.location.reload()} className="btn-default w-full justify-center">Reload</button>
                </div>
            </div>
        ) : (
            <>
                {viewMode === 'schema' ? (
                     <div className="flex-1 flex overflow-hidden">
                        {/* Schema Sidebar */}
                        <div className="w-64 flex flex-col border-r border-[var(--border-strong)] bg-[var(--bg-sidebar)]">
                            <div className="h-10 flex items-center px-3 border-b border-[var(--border-subtle)]">
                                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Entities</span>
                                <span className="ml-auto bg-[var(--border-strong)] text-[var(--text-primary)] text-[10px] px-1.5 rounded-full">
                                    {state.schema?.entities.length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                                {state.schema?.entities.map(e => (
                                    <button
                                        key={e.name}
                                        onClick={() => setSelectedEntity(e.name)}
                                        className={`w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors ${
                                            selectedEntity === e.name 
                                            ? 'bg-[var(--accent-surface)] text-[var(--accent-text)] font-semibold shadow-sm ring-1 ring-[var(--accent-primary)]/20' 
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-app)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedEntity === e.name ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-strong)]'}`}></div>
                                        <span className="truncate">{e.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Schema Details */}
                        <div className="flex-1 bg-[var(--bg-panel)] overflow-y-auto p-8 custom-scrollbar">
                            {currentEntity ? (
                                <div className="max-w-5xl mx-auto space-y-8">
                                    <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-5">
                                        <div>
                                            <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                                                <Box className="w-6 h-6 text-[var(--accent-primary)]" />
                                                {currentEntity.name}
                                            </h2>
                                            <p className="mt-1 text-xs font-mono text-[var(--text-muted)]">Namespace: {state.schema?.namespace}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-3">
                                            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                                                <Code2 className="w-4 h-4" /> Properties
                                            </h3>
                                            <div className="border border-[var(--border-strong)] rounded-md overflow-hidden bg-[var(--bg-panel)] shadow-sm">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-[var(--bg-app)] text-[var(--text-secondary)] border-b border-[var(--border-strong)]">
                                                        <tr>
                                                            <th className="px-4 py-2.5 font-semibold">Name</th>
                                                            <th className="px-4 py-2.5 font-semibold">Type</th>
                                                            <th className="px-4 py-2.5 font-semibold text-right">Nullable</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--border-subtle)]">
                                                        {currentEntity.properties.map((p, i) => (
                                                            <tr key={i} className="hover:bg-[var(--bg-app)] transition-colors">
                                                                <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                                                                    <div className="flex items-center gap-2">
                                                                        {p.name}
                                                                        {currentEntity.keys.includes(p.name) && <span title="Primary Key" className="text-[10px] cursor-help opacity-70">🔑</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 font-mono text-[var(--accent-text)]">{p.type}</td>
                                                                <td className="px-4 py-2 text-right text-[var(--text-muted)]">{p.nullable ? 'Yes' : 'No'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                             <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                                                <Layers className="w-4 h-4" /> Relations
                                            </h3>
                                            <div className="space-y-2">
                                                {currentEntity.navigationProperties.map((nav, i) => (
                                                    <div key={i} className="group p-3 border border-[var(--border-strong)] rounded-md bg-[var(--bg-app)] hover:border-[var(--accent-primary)] transition-all cursor-default">
                                                        <div className="text-xs font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)]">{nav.name}</div>
                                                        <div className="text-[10px] font-mono text-[var(--text-muted)] break-all">{nav.type}</div>
                                                    </div>
                                                ))}
                                                {currentEntity.navigationProperties.length === 0 && (
                                                    <div className="text-xs text-[var(--text-muted)] italic p-4 border border-dashed border-[var(--border-strong)] rounded bg-[var(--bg-app)] text-center">No navigation properties</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-60">
                                    <Box className="w-16 h-16 mb-4 stroke-1" />
                                    <p className="text-sm">Select an entity from the sidebar</p>
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