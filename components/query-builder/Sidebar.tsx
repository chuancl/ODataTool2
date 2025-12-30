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
        <div className="w-[340px] bg-surface border-r border-border flex flex-col h-full overflow-y-auto shrink-0 z-20 transition-all duration-200">
            {/* 核心配置区 */}
            <div className="p-5 border-b border-border bg-canvas/30 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 bg-brand text-white rounded-md"><Database className="w-3.5 h-3.5" /></div>
                    <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">数据集合</label>
                </div>
                <div className="relative">
                    <select 
                        value={selectedSet} 
                        onChange={e => onSetChange(e.target.value)}
                        className="w-full p-2.5 pl-3 pr-8 bg-surface border border-border rounded-xl text-sm font-bold text-text-main focus:ring-2 focus:ring-brand outline-none appearance-none shadow-sm transition-all"
                    >
                        {schema.entitySets.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
                {currentEntity && (
                    <div className="mt-2 text-[10px] text-brand/70 font-mono px-2 py-0.5 bg-brand/5 rounded-full inline-block border border-brand/10">Type: {currentEntity.name}</div>
                )}
            </div>

            {currentEntity ? (
                <div className="flex-1 p-5 space-y-8">
                    {/* $select */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-black text-text-main flex items-center gap-2 uppercase tracking-wider">
                                <LayoutGrid className="w-3.5 h-3.5 text-brand" /> 选择字段
                            </h3>
                            <button 
                                onClick={() => onPropChange(new Set(selectedProps.size === 0 ? currentEntity.properties.map(p=>p.name) : []))}
                                className="text-[10px] font-bold text-brand hover:underline bg-brand/5 px-2 py-0.5 rounded-full"
                            >
                                {selectedProps.size === 0 ? '全选' : '重置'}
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-border rounded-xl p-2 bg-canvas/50 grid grid-cols-1 gap-1 shadow-inner custom-scrollbar">
                            {currentEntity.properties.map(p => (
                                <label key={p.name} className="flex items-center gap-2.5 cursor-pointer hover:bg-surface px-2 py-1.5 rounded-lg transition-all group">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-brand rounded-md border-border focus:ring-brand bg-surface"
                                        checked={selectedProps.has(p.name)}
                                        onChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                    />
                                    <span className={`text-xs truncate transition-colors ${selectedProps.has(p.name) ? 'text-text-main font-bold' : 'text-text-muted group-hover:text-text-main'}`}>{p.name}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* $expand */}
                    {currentEntity.navigationProperties.length > 0 && (
                        <section>
                            <h3 className="text-xs font-black text-text-main mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <Layers3 className="w-3.5 h-3.5 text-brand" /> 关联展开
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {currentEntity.navigationProperties.map(np => (
                                    <label key={np.name} className={`px-3 py-1.5 rounded-xl text-xs border cursor-pointer transition-all ${expandProps.has(np.name) ? 'bg-brand text-white border-brand shadow-md shadow-brand/20' : 'bg-surface border-border text-text-muted hover:border-brand/50 hover:text-text-main'}`}>
                                        <input type="checkbox" className="hidden" checked={expandProps.has(np.name)} onChange={() => toggleSelection(expandProps, np.name, onExpandChange)} />
                                        {np.name}
                                    </label>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Filtering & Sorting */}
                    <section className="space-y-5 pt-2 border-t border-border/50">
                        <div>
                            <h3 className="text-xs font-black text-text-main mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <Filter className="w-3.5 h-3.5 text-brand" /> 过滤条件 ($filter)
                            </h3>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="e.g. Price gt 20" 
                                    className="w-full px-4 py-2.5 bg-canvas border border-border rounded-xl text-xs focus:ring-2 focus:ring-brand outline-none transition-all text-text-main placeholder:opacity-30"
                                    value={filter}
                                    onChange={e => onFilterChange(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black text-text-main mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <ArrowUpDown className="w-3.5 h-3.5 text-brand" /> 排序规则 ($orderby)
                            </h3>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 px-3 py-2 bg-canvas border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand transition-all text-text-main font-medium"
                                    value={orderBy}
                                    onChange={e => onOrderByChange(e.target.value)}
                                >
                                    <option value="">(无排序)</option>
                                    {currentEntity.properties.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                                <select 
                                    className="w-24 px-2 py-2 bg-canvas border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand font-bold"
                                    value={orderByDir}
                                    onChange={e => onOrderByDirChange(e.target.value as 'asc' | 'desc')}
                                >
                                    <option value="asc">ASC ↑</option>
                                    <option value="desc">DESC ↓</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Pagination */}
                    <section className="bg-canvas/50 p-4 rounded-2xl border border-border/50 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-3.5 h-3.5 text-brand" />
                            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">分页控制</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-bold text-text-muted mb-1 ml-1">$top</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand"
                                    placeholder="数量"
                                    value={top}
                                    onChange={e => onTopChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-text-muted mb-1 ml-1">$skip</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand"
                                    placeholder="跳过"
                                    value={skip}
                                    onChange={e => onSkipChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group pt-1">
                            <div className="relative">
                                <input type="checkbox" checked={count} onChange={e => onCountChange(e.target.checked)} className="peer hidden" />
                                <div className="w-9 h-5 bg-border rounded-full peer-checked:bg-brand transition-colors"></div>
                                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                            </div>
                            <span className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors">请求总数 ($count)</span>
                        </label>
                    </section>
                </div>
            ) : (
                <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3 opacity-30">
                    <Layers3 className="w-12 h-12 stroke-[1px]" />
                    <p className="text-xs font-bold">请选择实体集</p>
                </div>
            )}
        </div>
    );
};

export default Sidebar;