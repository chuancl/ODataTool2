import React from 'react';
import { ChevronDown, Filter, ArrowUpDown, Database, LayoutGrid, Layers, RefreshCw } from 'lucide-react';
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
        <div className="w-[300px] bg-surface-muted border-r border-border flex flex-col h-full overflow-y-auto shrink-0 text-sm">
            {/* Entity Selection */}
            <div className="p-4 border-b border-border bg-surface-muted sticky top-0 z-10">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Entity Set</label>
                <div className="relative">
                    <select 
                        value={selectedSet} 
                        onChange={e => onSetChange(e.target.value)}
                        className="input-base pr-8 font-semibold text-text-main"
                    >
                        {schema.entitySets.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                </div>
            </div>

            {currentEntity ? (
                <div className="flex-1 p-4 space-y-6">
                    {/* $select */}
                    <section>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[11px] font-bold text-text-sec flex items-center gap-1.5">
                                <LayoutGrid className="w-3 h-3 text-brand" /> Select
                            </h3>
                            <button 
                                onClick={() => onPropChange(new Set())}
                                className="text-[10px] text-text-muted hover:text-brand transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-border rounded-md p-1 bg-white dark:bg-slate-800 grid grid-cols-1 gap-0.5">
                            {currentEntity.properties.map(p => (
                                <label key={p.name} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-brand focus:ring-brand"
                                        checked={selectedProps.has(p.name)}
                                        onChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                    />
                                    <span className={`text-xs truncate ${selectedProps.has(p.name) ? 'text-text-main font-medium' : 'text-text-muted'}`}>{p.name}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* $expand */}
                    {currentEntity.navigationProperties.length > 0 && (
                        <section>
                             <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[11px] font-bold text-text-sec flex items-center gap-1.5">
                                    <Layers className="w-3 h-3 text-brand" /> Expand
                                </h3>
                            </div>
                            <div className="flex flex-col gap-1">
                                {currentEntity.navigationProperties.map(np => (
                                    <label key={np.name} className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer transition-all ${expandProps.has(np.name) ? 'bg-brand/5 border-brand/30' : 'bg-white dark:bg-slate-800 border-border hover:border-slate-300'}`}>
                                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-brand" checked={expandProps.has(np.name)} onChange={() => toggleSelection(expandProps, np.name, onExpandChange)} />
                                        <span className="text-xs font-medium text-text-main truncate">{np.name}</span>
                                    </label>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Parameters */}
                    <section className="space-y-3 pt-2 border-t border-border">
                        <div>
                            <h3 className="text-[11px] font-bold text-text-sec mb-1.5 flex items-center gap-1.5">
                                <Filter className="w-3 h-3" /> Filter
                            </h3>
                            <input 
                                type="text" 
                                placeholder="Price gt 20" 
                                className="input-base font-mono"
                                value={filter}
                                onChange={e => onFilterChange(e.target.value)}
                            />
                        </div>

                        <div>
                            <h3 className="text-[11px] font-bold text-text-sec mb-1.5 flex items-center gap-1.5">
                                <ArrowUpDown className="w-3 h-3" /> Sort
                            </h3>
                            <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <select 
                                        className="input-base pr-6"
                                        value={orderBy}
                                        onChange={e => onOrderByChange(e.target.value)}
                                    >
                                        <option value="">(None)</option>
                                        {currentEntity.properties.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="relative w-24">
                                     <select 
                                        className="input-base pr-6"
                                        value={orderByDir}
                                        onChange={e => onOrderByDirChange(e.target.value as 'asc' | 'desc')}
                                    >
                                        <option value="asc">Asc</option>
                                        <option value="desc">Desc</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted mb-1 block">Top</label>
                                <input 
                                    type="number" 
                                    className="input-base"
                                    placeholder="All"
                                    value={top}
                                    onChange={e => onTopChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted mb-1 block">Skip</label>
                                <input 
                                    type="number" 
                                    className="input-base"
                                    placeholder="0"
                                    value={skip}
                                    onChange={e => onSkipChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={count} onChange={e => onCountChange(e.target.checked)} className="rounded border-slate-300 text-brand focus:ring-brand" />
                            <span className="text-xs font-medium text-text-sec">Include Count ($count)</span>
                        </label>
                    </section>
                </div>
            ) : (
                <div className="p-8 text-center text-text-muted/50 mt-10">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Select an entity</p>
                </div>
            )}
        </div>
    );
};

export default Sidebar;