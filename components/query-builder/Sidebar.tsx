import React from 'react';
import { ChevronDown, Database, LayoutGrid, Layers, Filter, ArrowUpDown, Hash } from 'lucide-react';
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

const ConfigSection: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="mb-4">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Icon className="w-3 h-3" /> {title}
        </h3>
        <div className="pl-1">{children}</div>
    </div>
);

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
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-3">
            {/* Entity Select */}
            <div className="mb-4">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Entity Set</label>
                <div className="relative">
                    <select 
                        value={selectedSet} 
                        onChange={e => onSetChange(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-xs font-medium text-[var(--text-primary)] focus:border-[var(--accent-color)] outline-none appearance-none"
                    >
                        {schema.entitySets.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
                </div>
            </div>

            <div className="h-px bg-[var(--border-color)] mb-4"></div>

            {currentEntity ? (
                <div className="space-y-5">
                    {/* Columns */}
                    <ConfigSection title="Columns ($select)" icon={LayoutGrid}>
                         <div className="max-h-40 overflow-y-auto border border-[var(--border-color)] rounded bg-[var(--bg-input)] p-1 space-y-0.5 custom-scrollbar">
                            {currentEntity.properties.map(p => (
                                <label key={p.name} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${selectedProps.has(p.name) ? 'bg-[var(--accent-bg)]' : 'hover:bg-[var(--bg-app)]'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="w-3.5 h-3.5 rounded text-[var(--accent-color)] border-[var(--border-color)] focus:ring-[var(--accent-color)]"
                                        checked={selectedProps.has(p.name)}
                                        onChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                    />
                                    <span className={`text-xs truncate ${selectedProps.has(p.name) ? 'text-[var(--accent-color)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                                        {p.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </ConfigSection>

                    {/* Expand */}
                    {currentEntity.navigationProperties.length > 0 && (
                        <ConfigSection title="Relations ($expand)" icon={Layers}>
                            <div className="space-y-1">
                                {currentEntity.navigationProperties.map(np => (
                                    <label key={np.name} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer border transition-all ${expandProps.has(np.name) ? 'bg-[var(--accent-bg)] border-[var(--accent-color)]/30' : 'bg-[var(--bg-input)] border-[var(--border-color)] hover:border-[var(--accent-color)]/50'}`}>
                                        <input type="checkbox" className="hidden" checked={expandProps.has(np.name)} onChange={() => toggleSelection(expandProps, np.name, onExpandChange)} />
                                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${expandProps.has(np.name) ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' : 'border-[var(--text-muted)]'}`}>
                                            {expandProps.has(np.name) && <div className="w-1 h-1 bg-white rounded-full"/>}
                                        </div>
                                        <span className={`text-xs ${expandProps.has(np.name) ? 'text-[var(--accent-color)] font-medium' : 'text-[var(--text-secondary)]'}`}>{np.name}</span>
                                    </label>
                                ))}
                            </div>
                        </ConfigSection>
                    )}

                    {/* Filter */}
                    <ConfigSection title="Filter ($filter)" icon={Filter}>
                        <input 
                            type="text" 
                            placeholder="e.g. Price gt 20" 
                            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-xs focus:border-[var(--accent-color)] outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                            value={filter}
                            onChange={e => onFilterChange(e.target.value)}
                        />
                    </ConfigSection>

                    {/* Sort */}
                    <ConfigSection title="Sort ($orderby)" icon={ArrowUpDown}>
                        <div className="flex gap-2">
                             <div className="relative flex-1">
                                <select 
                                    className="w-full px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-xs appearance-none focus:border-[var(--accent-color)] outline-none text-[var(--text-primary)]"
                                    value={orderBy}
                                    onChange={e => onOrderByChange(e.target.value)}
                                >
                                    <option value="">(None)</option>
                                    {currentEntity.properties.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <button 
                                onClick={() => onOrderByDirChange(orderByDir === 'asc' ? 'desc' : 'asc')}
                                className="px-2 py-1 border border-[var(--border-color)] rounded bg-[var(--bg-input)] hover:bg-[var(--bg-app)] text-[var(--text-secondary)] text-[10px] font-bold uppercase w-12"
                            >
                                {orderByDir}
                            </button>
                        </div>
                    </ConfigSection>

                    {/* Pagination */}
                    <ConfigSection title="Pagination" icon={Hash}>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                                <label className="text-[9px] text-[var(--text-muted)] block mb-1">Top</label>
                                <input 
                                    type="number" 
                                    className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-xs focus:border-[var(--accent-color)] outline-none"
                                    placeholder="All"
                                    value={top}
                                    onChange={e => onTopChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-[var(--text-muted)] block mb-1">Skip</label>
                                <input 
                                    type="number" 
                                    className="w-full px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-xs focus:border-[var(--accent-color)] outline-none"
                                    placeholder="0"
                                    value={skip}
                                    onChange={e => onSkipChange(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={count} 
                                onChange={e => onCountChange(e.target.checked)} 
                                className="w-3.5 h-3.5 rounded text-[var(--accent-color)] focus:ring-[var(--accent-color)]" 
                            />
                            <span className="text-xs text-[var(--text-secondary)]">Include $count</span>
                        </label>
                    </ConfigSection>
                </div>
            ) : (
                <div className="text-center text-[var(--text-muted)] text-xs mt-10">Select an entity set</div>
            )}
        </div>
    );
};

export default Sidebar;