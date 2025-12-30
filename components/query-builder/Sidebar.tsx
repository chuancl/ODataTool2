import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Filter, ArrowUpDown, Database, LayoutGrid, Layers, Hash, SkipForward } from 'lucide-react';
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

const SidebarSection: React.FC<{ 
    title: string; 
    icon: React.ElementType; 
    children: React.ReactNode; 
    defaultOpen?: boolean; 
    badge?: number | string 
}> = ({ title, icon: Icon, children, defaultOpen = true, badge }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[var(--border-subtle)] last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-sidebar)] hover:bg-[var(--bg-app)] transition-colors select-none"
            >
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                    <Icon className="w-4 h-4" />
                    {title}
                </div>
                <div className="flex items-center gap-2">
                    {badge !== undefined && badge !== 0 && badge !== '' && (
                        <span className="text-[11px] px-2 py-0.5 bg-[var(--accent-surface)] text-[var(--accent-text)] rounded-full font-mono font-medium">{badge}</span>
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                </div>
            </button>
            {isOpen && (
                <div className="px-4 py-3 bg-[var(--bg-panel)] animate-in slide-in-from-top-1 duration-200">
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
        <div className="w-[280px] bg-[var(--bg-sidebar)] flex flex-col h-full overflow-y-auto custom-scrollbar shrink-0 border-r border-[var(--border-strong)] z-10">
            {/* Target Selection */}
            <div className="p-4 border-b border-[var(--border-strong)] bg-[var(--bg-sidebar)] sticky top-0 z-20 shadow-sm">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Target Entity Set</label>
                <div className="relative">
                    <select 
                        value={selectedSet} 
                        onChange={e => onSetChange(e.target.value)}
                        className="input-control pr-8 font-semibold text-sm h-10"
                    >
                        {schema.entitySets.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
            </div>

            {currentEntity ? (
                <div className="flex-1">
                    {/* $select */}
                    <SidebarSection title="Columns" icon={LayoutGrid} badge={selectedProps.size > 0 ? selectedProps.size : undefined}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[var(--text-muted)]">Select fields ($select)</span>
                            {selectedProps.size > 0 && (
                                <button onClick={() => onPropChange(new Set())} className="text-xs text-[var(--accent-text)] hover:underline">Reset</button>
                            )}
                        </div>
                        <div className="max-h-60 overflow-y-auto border border-[var(--border-subtle)] rounded bg-[var(--bg-app)] p-1 space-y-0.5 custom-scrollbar">
                            {currentEntity.properties.map(p => (
                                <label key={p.name} className="flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-panel)] cursor-pointer group transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)] focus:ring-0 checked:bg-[var(--accent-primary)] checked:border-[var(--accent-primary)] transition-all"
                                        checked={selectedProps.has(p.name)}
                                        onChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                    />
                                    <span className={`text-sm truncate ${selectedProps.has(p.name) ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                                        {p.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </SidebarSection>

                    {/* $expand */}
                    {currentEntity.navigationProperties.length > 0 && (
                        <SidebarSection title="Relations" icon={Layers} badge={expandProps.size > 0 ? expandProps.size : undefined} defaultOpen={false}>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[var(--text-muted)] mb-2">Expand relations ($expand)</span>
                                {currentEntity.navigationProperties.map(np => (
                                    <label key={np.name} className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all ${
                                        expandProps.has(np.name) 
                                        ? 'bg-[var(--accent-surface)] border-[var(--accent-primary)]/30 text-[var(--accent-text)] font-medium' 
                                        : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                                    }`}>
                                        <input type="checkbox" className="hidden" checked={expandProps.has(np.name)} onChange={() => toggleSelection(expandProps, np.name, onExpandChange)} />
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${expandProps.has(np.name) ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-[var(--text-muted)]'}`}>
                                            {expandProps.has(np.name) && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-sm truncate">{np.name}</span>
                                    </label>
                                ))}
                            </div>
                        </SidebarSection>
                    )}

                    {/* Filtering */}
                    <SidebarSection title="Filter & Sort" icon={Filter} badge={filter ? '1' : undefined}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Filter ($filter)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Price gt 20" 
                                    className="input-control font-mono placeholder:text-[var(--text-muted)]/50"
                                    value={filter}
                                    onChange={e => onFilterChange(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Order By ($orderby)</label>
                                <div className="flex gap-2">
                                    <select 
                                        className="input-control flex-1"
                                        value={orderBy}
                                        onChange={e => onOrderByChange(e.target.value)}
                                    >
                                        <option value="">(None)</option>
                                        {currentEntity.properties.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => onOrderByDirChange(orderByDir === 'asc' ? 'desc' : 'asc')}
                                        className="px-3 border border-[var(--border-strong)] rounded bg-[var(--bg-panel)] hover:bg-[var(--bg-app)] text-[var(--text-secondary)] text-xs font-bold"
                                        title="Toggle Direction"
                                    >
                                        {orderByDir === 'asc' ? 'ASC' : 'DESC'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SidebarSection>

                    {/* Paging */}
                    <SidebarSection title="Pagination" icon={Hash} badge={(top || skip) ? '•' : undefined} defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Top</label>
                                <input 
                                    type="number" 
                                    className="input-control"
                                    placeholder="All"
                                    value={top}
                                    onChange={e => onTopChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Skip</label>
                                <input 
                                    type="number" 
                                    className="input-control"
                                    placeholder="0"
                                    value={skip}
                                    onChange={e => onSkipChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] hover:border-[var(--border-strong)] transition-colors">
                            <input 
                                type="checkbox" 
                                checked={count} 
                                onChange={e => onCountChange(e.target.checked)} 
                                className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)] focus:ring-0" 
                            />
                            <span className="text-sm font-medium text-[var(--text-primary)]">Include Count ($count)</span>
                        </label>
                    </SidebarSection>
                </div>
            ) : (
                <div className="p-8 text-center text-[var(--text-muted)] mt-10">
                    <p className="text-sm">No Entity Selected</p>
                </div>
            )}
        </div>
    );
};

export default Sidebar;