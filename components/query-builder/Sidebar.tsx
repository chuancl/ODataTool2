import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Filter, LayoutGrid, Layers, Hash } from 'lucide-react';
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

const ConfigGroup: React.FC<{ 
    title: string; 
    icon: React.ElementType; 
    children: React.ReactNode; 
    defaultOpen?: boolean; 
    badge?: number | string 
}> = ({ title, icon: Icon, children, defaultOpen = true, badge }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="mb-2">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--bg-page)] transition-colors select-none rounded-lg group"
            >
                <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--text-main)] group-hover:text-violet-600 transition-colors">
                    <Icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-violet-500" />
                    {title}
                </div>
                <div className="flex items-center gap-2">
                    {badge !== undefined && badge !== 0 && badge !== '' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-bold">{badge}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                </div>
            </button>
            {isOpen && (
                <div className="px-4 py-2 animate-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

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
        <div className="flex flex-col gap-2 p-2 pb-10">
            {/* Entity Select */}
            <div className="px-4 py-4">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Source Entity</label>
                <div className="relative">
                    <select 
                        value={selectedSet} 
                        onChange={e => onSetChange(e.target.value)}
                        className="modern-input border border-[var(--border-light)] bg-white font-semibold appearance-none pr-10"
                    >
                        {schema.entitySets.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
            </div>

            <div className="h-px bg-[var(--border-light)] mx-4 mb-2"></div>

            {currentEntity ? (
                <>
                    {/* Columns */}
                    <ConfigGroup title="Select Columns" icon={LayoutGrid} badge={selectedProps.size > 0 ? selectedProps.size : undefined}>
                         <div className="flex justify-end mb-2">
                            {selectedProps.size > 0 && <button onClick={() => onPropChange(new Set())} className="text-xs text-violet-600 hover:underline">Clear</button>}
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                            {currentEntity.properties.map(p => (
                                <label key={p.name} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${selectedProps.has(p.name) ? 'bg-violet-50 border-violet-100' : 'hover:bg-[var(--bg-page)] border-transparent'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded text-violet-600 border-zinc-300 focus:ring-violet-500"
                                        checked={selectedProps.has(p.name)}
                                        onChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                    />
                                    <span className={`text-sm truncate ${selectedProps.has(p.name) ? 'text-[var(--text-main)] font-medium' : 'text-[var(--text-muted)]'}`}>
                                        {p.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </ConfigGroup>

                    {/* Expand */}
                    {currentEntity.navigationProperties.length > 0 && (
                        <ConfigGroup title="Expand Relations" icon={Layers} badge={expandProps.size > 0 ? expandProps.size : undefined} defaultOpen={false}>
                            <div className="space-y-1">
                                {currentEntity.navigationProperties.map(np => (
                                    <label key={np.name} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${expandProps.has(np.name) ? 'bg-violet-50 border-violet-100 text-violet-700 font-medium' : 'hover:bg-[var(--bg-page)] border-transparent text-[var(--text-muted)]'}`}>
                                        <input type="checkbox" className="hidden" checked={expandProps.has(np.name)} onChange={() => toggleSelection(expandProps, np.name, onExpandChange)} />
                                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${expandProps.has(np.name) ? 'border-violet-500 bg-violet-500 text-white' : 'border-zinc-300'}`}>
                                            {expandProps.has(np.name) && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-sm truncate">{np.name}</span>
                                    </label>
                                ))}
                            </div>
                        </ConfigGroup>
                    )}

                    {/* Filter */}
                    <ConfigGroup title="Filter & Sort" icon={Filter} badge={filter ? '•' : undefined}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Filter ($filter)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Price gt 20" 
                                    className="modern-input text-xs border border-[var(--border-light)]"
                                    value={filter}
                                    onChange={e => onFilterChange(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Order By</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                         <select 
                                            className="modern-input text-xs border border-[var(--border-light)] appearance-none"
                                            value={orderBy}
                                            onChange={e => onOrderByChange(e.target.value)}
                                        >
                                            <option value="">(None)</option>
                                            {currentEntity.properties.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-2.5 w-3 h-3 text-[var(--text-muted)] pointer-events-none" />
                                    </div>
                                    <button 
                                        onClick={() => onOrderByDirChange(orderByDir === 'asc' ? 'desc' : 'asc')}
                                        className="px-3 border border-[var(--border-light)] rounded-lg bg-white hover:bg-[var(--bg-page)] text-[var(--text-muted)] text-xs font-bold"
                                    >
                                        {orderByDir === 'asc' ? 'ASC' : 'DESC'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </ConfigGroup>

                    {/* Pagination */}
                    <ConfigGroup title="Pagination" icon={Hash} badge={(top || skip) ? '•' : undefined} defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Top</label>
                                <input 
                                    type="number" 
                                    className="modern-input text-xs border border-[var(--border-light)]"
                                    placeholder="All"
                                    value={top}
                                    onChange={e => onTopChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Skip</label>
                                <input 
                                    type="number" 
                                    className="modern-input text-xs border border-[var(--border-light)]"
                                    placeholder="0"
                                    value={skip}
                                    onChange={e => onSkipChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-[var(--border-light)] bg-white hover:border-violet-300 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={count} 
                                onChange={e => onCountChange(e.target.checked)} 
                                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500" 
                            />
                            <span className="text-sm font-medium text-[var(--text-main)]">Include Count</span>
                        </label>
                    </ConfigGroup>
                </>
            ) : (
                <div className="p-4 text-center text-zinc-400 text-sm">Select an entity to configure</div>
            )}
        </div>
    );
};

export default Sidebar;