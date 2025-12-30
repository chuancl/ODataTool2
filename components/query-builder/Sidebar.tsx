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
        <div className="w-[340px] bg-surface border-r-2 border-border flex flex-col h-full overflow-y-auto shrink-0 z-20 shadow-2xl">
            {/* 核心配置区 */}
            <div className="p-10 border-b-2 border-border bg-canvas/50 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-brand/20 text-brand rounded-2xl border-2 border-brand/20"><Database className="w-6 h-6" /></div>
                    <label className="text-sm font-black text-text-main uppercase tracking-[0.25em]">数据集合</label>
                </div>
                <div className="relative">
                    <select 
                        value={selectedSet} 
                        onChange={e => onSetChange(e.target.value)}
                        className="w-full p-4 pl-5 pr-12 bg-surface border-2 border-border rounded-2xl text-base font-black text-text-main focus:ring-4 focus:ring-brand/20 focus:border-brand outline-none appearance-none shadow-md transition-all"
                    >
                        {schema.entitySets.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-5 w-6 h-6 text-text-main pointer-events-none" />
                </div>
                {currentEntity && (
                    <div className="mt-6">
                        <span className="text-xs font-black text-brand uppercase tracking-widest px-3 py-1.5 bg-brand/10 rounded-xl border-2 border-brand/20 shadow-sm">
                            类型: {currentEntity.name}
                        </span>
                    </div>
                )}
            </div>

            {currentEntity ? (
                <div className="flex-1 p-10 space-y-12">
                    {/* $select */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-text-main flex items-center gap-3 uppercase tracking-widest">
                                <LayoutGrid className="w-5 h-5 text-brand" /> 投影字段 ($select)
                            </h3>
                            <button 
                                onClick={() => onPropChange(new Set(selectedProps.size === 0 ? currentEntity.properties.map(p=>p.name) : []))}
                                className="text-[11px] font-black text-brand bg-brand/10 px-4 py-2 rounded-xl hover:bg-brand hover:text-brand-fg transition-all uppercase border-2 border-brand/20 shadow-sm"
                            >
                                {selectedProps.size === 0 ? '全选' : '清空'}
                            </button>
                        </div>
                        <div className="max-h-72 overflow-y-auto border-2 border-border rounded-3xl p-4 bg-canvas/30 grid grid-cols-1 gap-2.5 shadow-inner custom-scrollbar">
                            {currentEntity.properties.map(p => (
                                <label key={p.name} className="flex items-center gap-4 cursor-pointer hover:bg-surface p-3.5 rounded-2xl transition-all group border-2 border-transparent hover:border-border hover:shadow-md">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded-lg border-2 border-border text-brand focus:ring-brand bg-surface transition-all"
                                        checked={selectedProps.has(p.name)}
                                        onChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                    />
                                    <span className={`text-sm font-black truncate transition-colors ${selectedProps.has(p.name) ? 'text-text-main' : 'text-text-muted'}`}>{p.name}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* $expand */}
                    {currentEntity.navigationProperties.length > 0 && (
                        <section>
                            <h3 className="text-xs font-black text-text-main mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <Layers3 className="w-5 h-5 text-brand" /> 关联展开 ($expand)
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {currentEntity.navigationProperties.map(np => (
                                    <label key={np.name} className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 cursor-pointer transition-all shadow-md ${expandProps.has(np.name) ? 'bg-brand text-brand-fg border-brand' : 'bg-surface border-border text-text-muted hover:border-brand hover:text-brand'}`}>
                                        <input type="checkbox" className="hidden" checked={expandProps.has(np.name)} onChange={() => toggleSelection(expandProps, np.name, onExpandChange)} />
                                        {np.name}
                                    </label>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Filtering & Sorting */}
                    <section className="space-y-8 pt-4">
                        <div>
                            <h3 className="text-xs font-black text-text-main mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <Filter className="w-5 h-5 text-brand" /> 数据过滤 ($filter)
                            </h3>
                            <input 
                                type="text" 
                                placeholder="输入过滤表达式..." 
                                className="w-full px-6 py-4 bg-canvas border-2 border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all text-text-main placeholder:text-text-muted/30 shadow-md"
                                value={filter}
                                onChange={e => onFilterChange(e.target.value)}
                            />
                        </div>

                        <div>
                            <h3 className="text-xs font-black text-text-main mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <ArrowUpDown className="w-5 h-5 text-brand" /> 结果排序 ($orderby)
                            </h3>
                            <div className="flex flex-col gap-4">
                                <select 
                                    className="w-full px-5 py-4 bg-canvas border-2 border-border rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all text-text-main font-bold appearance-none shadow-md"
                                    value={orderBy}
                                    onChange={e => onOrderByChange(e.target.value)}
                                >
                                    <option value="">(默认排序)</option>
                                    {currentEntity.properties.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                                <select 
                                    className="w-full px-5 py-4 bg-canvas border-2 border-border rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand shadow-md uppercase tracking-widest"
                                    value={orderByDir}
                                    onChange={e => onOrderByDirChange(e.target.value as 'asc' | 'desc')}
                                >
                                    <option value="asc">升序排列 ↑</option>
                                    <option value="desc">降序排列 ↓</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Pagination */}
                    <section className="bg-canvas p-8 rounded-[2rem] border-2 border-border shadow-xl space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="w-5 h-5 text-brand" />
                            <span className="text-xs font-black uppercase text-text-main tracking-widest">性能与分页</span>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-text-muted mb-3 ml-1 uppercase tracking-widest">请求条数 ($top)</label>
                                <input 
                                    type="number" 
                                    className="w-full px-5 py-4 bg-surface border-2 border-border rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all shadow-md"
                                    placeholder="数量"
                                    value={top}
                                    onChange={e => onTopChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-text-muted mb-3 ml-1 uppercase tracking-widest">跳过条数 ($skip)</label>
                                <input 
                                    type="number" 
                                    className="w-full px-5 py-4 bg-surface border-2 border-border rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all shadow-md"
                                    placeholder="偏移"
                                    value={skip}
                                    onChange={e => onSkipChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer group p-5 bg-surface rounded-2xl border-2 border-border hover:border-brand transition-all shadow-md">
                            <span className="text-xs font-black text-text-main uppercase tracking-widest group-hover:text-brand transition-colors">统计总数 ($count)</span>
                            <div className="relative">
                                <input type="checkbox" checked={count} onChange={e => onCountChange(e.target.checked)} className="peer hidden" />
                                <div className="w-12 h-7 bg-border rounded-full peer-checked:bg-brand transition-all shadow-inner border-2 border-transparent"></div>
                                <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-lg border border-border"></div>
                            </div>
                        </label>
                    </section>
                </div>
            ) : (
                <div className="p-24 text-center text-text-muted flex flex-col items-center gap-8 opacity-20 select-none">
                    <Layers3 className="w-32 h-32 stroke-[0.5px]" />
                    <p className="text-xs font-black uppercase tracking-[0.5em]">请选择实体</p>
                </div>
            )}
        </div>
    );
};

export default Sidebar;