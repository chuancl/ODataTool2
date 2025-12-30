import React from 'react';
import { ChevronDown, Check, Plus, Filter, ArrowUpDown, Database, LayoutGrid, Layers3, Activity } from 'lucide-react';
import { ODataSchema, ODataEntity } from '../../types';

interface SidebarProps {
    schema: ODataSchema;
    selectedSet: string;
    onSetChange: (val: string) => void;
    currentEntity: ODataEntity | null | undefined;
    selectedProps: Set<string>;
    onPropChange: (set: Set<string>) => void;
    expandProps: Set<string>;
    onExpandChange: (set: Set<string>) => void;
    filter: string;
    onFilterChange: (val: string) => void;
    orderBy: string;
    onOrderByChange: (val: string) => void;
    orderByDir: 'asc' | 'desc';
    onOrderByDirChange: (val: 'asc' | 'desc') => void;
    top: number | '';
    onTopChange: (val: number | '') => void;
    skip: number | '';
    onSkipChange: (val: number | '') => void;
    count: boolean;
    onCountChange: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    schema, selectedSet, onSetChange, currentEntity,
    selectedProps, onPropChange,
    expandProps, onExpandChange,
    filter, onFilterChange,
    orderBy, onOrderByChange,
    orderByDir, onOrderByDirChange,
    top, onTopChange,
    skip, onSkipChange,
    count, onCountChange
}) => {

    const toggleSelection = (set: Set<string>, val: string, updater: (newSet: Set<string>) => void) => {
        const newSet = new Set(set);
        if (newSet.has(val)) newSet.delete(val);
        else newSet.add(val);
        updater(newSet);
    };

    return (
        <div className="w-80 bg-surface/50 border-r border-border flex flex-col h-full overflow-y-auto shrink-0 z-20">
            {/* 核心配置区 */}
            <div className="p-8 border-b border-border bg-canvas/30 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/10 text-brand rounded-xl"><Database className="w-4 h-4" /></div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">数据集 (EntitySet)</label>
                </div>
                <div className="relative">
                    <select 
                        value={selectedSet} 
                        onChange={e => onSetChange(e.target.value)}
                        className="w-full p-3 pl-4 pr-10 bg-surface border border-border rounded-2xl text-xs font-black text-text-main focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none shadow-sm transition-all"
                    >
                        {schema.entitySets.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-text-muted pointer-events-none opacity-40" />
                </div>
                {currentEntity && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[9px] font-black text-brand/60 uppercase tracking-widest px-2 py-1 bg-brand/5 rounded-lg border border-brand/10">Type: {currentEntity.name}</span>
                    </div>
                )}
            </div>

            {currentEntity ? (
                <div className="flex-1 p-8 space-y-10">
                    {/* $select */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-text-main flex items-center gap-2 uppercase tracking-[0.2em]">
                                <LayoutGrid className="w-4 h-4 text-brand" /> 投影字段 ($select)
                            </h3>
                            <button 
                                onClick={() => onPropChange(new Set(selectedProps.size === 0 ? currentEntity.properties.map(p=>p.name) : []))}
                                className="text-[9px] font-black text-brand bg-brand/5 px-2.5 py-1 rounded-lg hover:bg-brand/10 transition-colors uppercase tracking-widest"
                            >
                                {selectedProps.size === 0 ? '全选' : '清空'}
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto border border-border rounded-2xl p-3 bg-canvas/50 grid grid-cols-1 gap-1.5 shadow-inner custom-scrollbar">
                            {currentEntity.properties.map(p => (
                                <label key={p.name} className="flex items-center gap-3 cursor-pointer hover:bg-surface p-2.5 rounded-xl transition-all group border border-transparent hover:border-border hover:shadow-sm">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded-md border-border text-brand focus:ring-brand bg-surface transition-all"
                                        checked={selectedProps.has(p.name)}
                                        onChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                    />
                                    <span className={`text-xs font-bold truncate transition-colors ${selectedProps.has(p.name) ? 'text-text-main' : 'text-text-muted opacity-60 group-hover:opacity-100'}`}>{p.name}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* $expand */}
                    {currentEntity.navigationProperties.length > 0 && (
                        <section>
                            <h3 className="text-[10px] font-black text-text-main mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                                <Layers3 className="w-4 h-4 text-brand" /> 关联展开 ($expand)
                            </h3>
                            <div className="flex flex-wrap gap-2.5">
                                {currentEntity.navigationProperties.map(np => (
                                    <label key={np.name} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer transition-all ${expandProps.has(np.name) ? 'bg-brand text-brand-fg border-brand shadow-lg shadow-indigo-500/20' : 'bg-surface border-border text-text-muted hover:border-brand/40 hover:text-text-main'}`}>
                                        <input type="checkbox" className="hidden" checked={expandProps.has(np.name)} onChange={() => toggleSelection(expandProps, np.name, onExpandChange)} />
                                        {np.name}
                                    </label>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Filtering & Sorting */}
                    <section className="space-y-6 pt-2">
                        <div>
                            <h3 className="text-[10px] font-black text-text-main mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                                <Filter className="w-4 h-4 text-brand" /> 数据过滤 ($filter)
                            </h3>
                            <input 
                                type="text" 
                                placeholder="e.g. Price gt 100" 
                                className="w-full px-5 py-3 bg-canvas border border-border rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-text-main placeholder:opacity-20 shadow-sm"
                                value={filter}
                                onChange={e => onFilterChange(e.target.value)}
                            />
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-text-main mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                                <ArrowUpDown className="w-4 h-4 text-brand" /> 结果排序 ($orderby)
                            </h3>
                            <div className="flex gap-2.5">
                                <select 
                                    className="flex-1 px-4 py-3 bg-canvas border border-border rounded-2xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-text-main font-bold appearance-none shadow-sm"
                                    value={orderBy}
                                    onChange={e => onOrderByChange(e.target.value)}
                                >
                                    <option value="">(默认)</option>
                                    {currentEntity.properties.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                                <select 
                                    className="w-28 px-3 py-3 bg-canvas border border-border rounded-2xl text-[10px] font-black outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm uppercase tracking-widest"
                                    value={orderByDir}
                                    onChange={e => onOrderByDirChange(e.target.value as 'asc' | 'desc')}
                                >
                                    <option value="asc">升序 ↑</option>
                                    <option value="desc">降序 ↓</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Pagination */}
                    <section className="bg-canvas/40 p-6 rounded-3xl border border-border/60 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-brand" />
                            <span className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">控制参数</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-text-muted mb-2 ml-1 uppercase tracking-widest">$top (条数)</label>
                                <input 
                                    type="number" 
                                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    placeholder="数量"
                                    value={top}
                                    onChange={e => onTopChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-text-muted mb-2 ml-1 uppercase tracking-widest">$skip (跳过)</label>
                                <input 
                                    type="number" 
                                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    placeholder="偏置"
                                    value={skip}
                                    onChange={e => onSkipChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer group p-3 bg-surface rounded-2xl border border-transparent hover:border-brand/20 transition-all">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest group-hover:text-brand transition-colors">统计总数 ($count)</span>
                            <div className="relative">
                                <input type="checkbox" checked={count} onChange={e => onCountChange(e.target.checked)} className="peer hidden" />
                                <div className="w-10 h-6 bg-border rounded-full peer-checked:bg-brand transition-all shadow-inner"></div>
                                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4 shadow-sm"></div>
                            </div>
                        </label>
                    </section>
                </div>
            ) : (
                <div className="p-16 text-center text-text-muted flex flex-col items-center gap-6 opacity-10 select-none">
                    <Layers3 className="w-20 h-20 stroke-[0.5px]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">尚未就绪</p>
                </div>
            )}
        </div>
    );
};

export default Sidebar;