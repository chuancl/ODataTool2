import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { 
    Layers, Zap, Database, Moon, Sun, Box, Code2, 
    LayoutDashboard, ArrowRight, Search, Globe, Table2 
} from 'lucide-react';
import { ViewerState } from '../../types';
import { parseODataMetadata, inferMetadataUrl } from '../../services/odataService';
import QueryBuilder from '../../components/QueryBuilder';
import '../../assets/main.css';

type Theme = 'light' | 'dark';

const ODataViewerApp: React.FC = () => {
  const [state, setState] = useState<ViewerState>({ sourceType: 'raw', isLoading: true });
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schema' | 'query'>('schema'); // Main Tab
  const [theme, setTheme] = useState<Theme>('light');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredEntities = state.schema?.entities.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // --- Components ---

  const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mb-1 ${
            active 
            ? 'bg-white/10 text-white font-medium shadow-sm' 
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex w-screen h-screen bg-[var(--bg-page)] text-[var(--text-main)] overflow-hidden">
        
        {/* --- 1. 左侧深色一级导航 (Icon Nav) --- */}
        <div className="w-[260px] bg-[var(--bg-sidebar)] flex flex-col shrink-0 z-20 shadow-xl">
            {/* Branding */}
            <div className="h-20 flex items-center px-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white mr-3 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                    <Database className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-base tracking-tight">OData Viz</span>
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Explorer</span>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="px-4 mb-8">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 px-2">Menu</div>
                <NavItem icon={LayoutDashboard} label="Schema Overview" active={activeTab === 'schema'} onClick={() => setActiveTab('schema')} />
                <NavItem icon={Zap} label="Query Builder" active={activeTab === 'query'} onClick={() => setActiveTab('query')} />
            </div>

            {/* Entity List (Mini) */}
            <div className="flex-1 flex flex-col min-h-0 px-4">
                <div className="flex items-center justify-between mb-3 px-2">
                     <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Entities</div>
                     <div className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{state.schema?.entities.length || 0}</div>
                </div>
                
                {/* Search Entities */}
                <div className="mb-3 relative group">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Filter..." 
                        className="w-full bg-zinc-800/50 text-zinc-300 text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:bg-zinc-800 transition-all border border-transparent focus:border-zinc-700"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pb-4">
                    {!state.isLoading && filteredEntities.map(e => (
                        <button
                            key={e.name}
                            onClick={() => setSelectedEntity(e.name)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate flex items-center gap-2 ${
                                selectedEntity === e.name
                                ? 'bg-violet-600 text-white font-medium shadow-md shadow-violet-900/20' 
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                            }`}
                        >
                            <Box className="w-3.5 h-3.5 opacity-70" />
                            {e.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom: Settings / Theme */}
            <div className="p-4 border-t border-white/5">
                <button 
                    onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
                >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>Toggle Theme</span>
                </button>
            </div>
        </div>

        {/* --- 2. 右侧内容区 (Main Stage) --- */}
        <main className="flex-1 relative flex flex-col min-w-0">
             {/* Background Decoration */}
             <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0"></div>

             {/* Dynamic Header */}
             <div className="h-20 px-8 flex items-center justify-between z-10 shrink-0">
                 <div>
                     <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-3">
                         {activeTab === 'schema' ? 'Entity Schema' : 'Query Playground'}
                     </h1>
                     <div className="flex items-center gap-2 mt-1 opacity-60 text-xs">
                         <Globe className="w-3 h-3" />
                         <span className="max-w-[400px] truncate">{state.url || 'No Source Loaded'}</span>
                     </div>
                 </div>
                 <div className="flex gap-3">
                     {/* Actions can go here */}
                 </div>
             </div>

             {/* Content Container */}
             <div className="flex-1 px-8 pb-8 overflow-hidden z-10 flex">
                 <div className="w-full h-full card-base overflow-hidden flex flex-col relative bg-[var(--bg-surface)]">
                    {state.isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-zinc-100 border-t-violet-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-zinc-400 font-medium">Parsing Metadata...</p>
                        </div>
                    ) : state.error ? (
                        <div className="flex-1 flex items-center justify-center text-center p-10">
                            <div className="max-w-md">
                                <div className="text-5xl mb-4">😵</div>
                                <h3 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h3>
                                <p className="text-zinc-500 mb-6">{state.error}</p>
                                <button onClick={() => window.location.reload()} className="btn-modern-primary mx-auto">Reload</button>
                            </div>
                        </div>
                    ) : (
                        activeTab === 'schema' ? (
                            /* Schema View */
                            currentEntity ? (
                                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                    <div className="max-w-4xl mx-auto">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
                                                <Box className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-bold text-[var(--text-main)]">{currentEntity.name}</h2>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-[var(--text-muted)]">
                                                    <span className="px-2 py-0.5 rounded bg-[var(--bg-page)] border border-[var(--border-light)] font-mono text-xs">Entity</span>
                                                    <span>•</span>
                                                    <span className="font-mono opacity-70">NS: {state.schema?.namespace}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {/* Properties Card */}
                                            <div className="md:col-span-2 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold flex items-center gap-2"><Code2 className="w-5 h-5 text-violet-500"/> Properties</h3>
                                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{currentEntity.properties.length}</span>
                                                </div>
                                                <div className="border border-[var(--border-light)] rounded-xl overflow-hidden">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-[var(--bg-page)] text-[var(--text-muted)] font-medium">
                                                            <tr>
                                                                <th className="px-5 py-3">Property Name</th>
                                                                <th className="px-5 py-3">Data Type</th>
                                                                <th className="px-5 py-3 text-right">Nullable</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[var(--border-light)]">
                                                            {currentEntity.properties.map(p => (
                                                                <tr key={p.name} className="hover:bg-[var(--bg-page)] transition-colors">
                                                                    <td className="px-5 py-3.5">
                                                                        <div className="flex items-center gap-2 font-medium text-[var(--text-main)]">
                                                                            {p.name}
                                                                            {currentEntity.keys.includes(p.name) && <span title="PK" className="text-[10px] text-amber-500 bg-amber-50 px-1.5 rounded">KEY</span>}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-3.5 font-mono text-xs text-violet-600 dark:text-violet-400">{p.type}</td>
                                                                    <td className="px-5 py-3.5 text-right text-[var(--text-muted)] opacity-60">{p.nullable ? 'Yes' : 'No'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Relations Card */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold flex items-center gap-2"><Layers className="w-5 h-5 text-violet-500"/> Relations</h3>
                                                <div className="space-y-3">
                                                    {currentEntity.navigationProperties.map((nav, i) => (
                                                        <div key={i} onClick={() => setSelectedEntity(nav.type.split('.').pop() || nav.type)} className="p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-page)]/50 hover:bg-white hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-bold text-sm text-[var(--text-main)] group-hover:text-violet-600">{nav.name}</span>
                                                                <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-violet-500 transform group-hover:translate-x-1 transition-transform" />
                                                            </div>
                                                            <div className="text-xs text-[var(--text-muted)] truncate font-mono">{nav.type}</div>
                                                        </div>
                                                    ))}
                                                    {currentEntity.navigationProperties.length === 0 && (
                                                        <div className="p-8 text-center border border-dashed border-[var(--border-light)] rounded-xl text-zinc-400 text-sm">
                                                            No navigation properties
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
                                    <div className="w-24 h-24 bg-[var(--bg-page)] rounded-full flex items-center justify-center mb-4">
                                        <Table2 className="w-10 h-10 opacity-30" />
                                    </div>
                                    <p className="text-lg font-medium">Select an entity from the sidebar</p>
                                </div>
                            )
                        ) : (
                            /* Query View */
                            <QueryBuilder schema={state.schema!} metadataUrl={state.url || ''} />
                        )
                    )}
                 </div>
             </div>
        </main>
    </div>
  );
};

// HMR Safe Root
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = (rootElement as any)._reactRoot || ReactDOM.createRoot(rootElement);
    (rootElement as any)._reactRoot = root;
    root.render(<React.StrictMode><ODataViewerApp /></React.StrictMode>);
}
