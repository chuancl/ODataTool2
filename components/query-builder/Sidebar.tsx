import React from 'react';
import { ChevronDown, Database, LayoutGrid, Layers, Filter, ArrowUpDown, Hash, Check } from 'lucide-react';
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
    <div className="mb-6">
        <h3 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5 select-none">
            <Icon className="w-3.5 h-3.5" /> {title}
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
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-1">
            {/* Entity Select - Highlighted */}
            <div className="mb-6">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Target Entity</label>
                <div className="relative group">
                    <select 
                        value={selectedSet} 
                        onChange={e => onSetChange(e.target.value)}
                        className="w-full pl-3 pr-8 py-2.5 bg-hover border border-transparent rounded-lg text-sm font-semibold text-main focus:bg-app focus:border-[rgb(var(--c-accent))] outline-none appearance-none transition-all cursor-pointer shadow-sm"
                    >
                        {schema.entitySets.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted pointer-events-none group-hover:text-main transition-colors" />
                </div>
            </div>

            {currentEntity ? (
                <>
                    {/* Columns */}
                    <ConfigSection title="Columns" icon={LayoutGrid}>
                         <div className="max-h-[200px] overflow-y-auto custom-scrollbar -ml-1 pr-1 space-y-0.5">
                            {currentEntity.properties.map(p => (
                                <label key={p.name} className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all ${selectedProps.has(p.name) ? 'bg-[rgb(var(--c-accent-subtle))]' : 'hover:bg-hover'}`}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${selectedProps.has(p.name) ? 'bg-[rgb(var(--c-accent))] border-[rgb(var(--c-accent))]' : 'border-muted bg-app group-hover:border-sec'}`}>
                                            {selectedProps.has(p.name) && <Check className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                        <span className={`text-xs truncate select-none ${selectedProps.has(p.name) ? 'text-main font-medium' : 'text-sec'}`}>
                                            {p.name}
                                        </span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={selectedProps.has(p.name)}
                                        onChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                    />
                                </label>
                            ))}
                        </div>
                    </ConfigSection>

                    {/* Expand */}
                    {currentEntity.navigationProperties.length > 0 && (
                        <ConfigSection title="Relations" icon={Layers}>
                            <div className="space-y-1">
                                {currentEntity.navigationProperties.map(np => (
                                    <label key={np.name} className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer border transition-all ${expandProps.has(np.name) ? 'bg-[rgb(var(--c-accent-subtle))] border-[rgb(var(--c-accent))]/30' : 'bg-app border-base hover:border-[rgb(var(--c-accent))]'}`}>
                                        <span className={`text-xs select-none ${expandProps.has(np.name) ? 'text-[rgb(var(--c-accent))] font-medium' : 'text-sec'}`}>{np.name}</span>
                                        <input type="checkbox" className="hidden" checked={expandProps.has(np.name)} onChange={() => toggleSelection(expandProps, np.name, onExpandChange)} />
                                        <div className={`w-2 h-2 rounded-full transition-colors ${expandProps.has(np.name) ? 'bg-[rgb(var(--c-accent))]' : 'bg-base'}`} />
                                    </label>
                                ))}
                            </div>
                        </ConfigSection>
                    )}

                    {/* Filter */}
                    <ConfigSection title="Filter" icon={Filter}>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Price gt 20" 
                                className="w-full px-3 py-2 bg-hover border border-transparent rounded-md text-xs focus:bg-app focus:border-[rgb(var(--c-accent))] focus:ring-1 focus:ring-[rgb(var(--c-accent))] outline-none text-main placeholder-muted transition-all"
                                value={filter}
                                onChange={e => onFilterChange(e.target.value)}
                            />
                        </div>
                    </ConfigSection>

                    {/* Sort */}
                    <ConfigSection title="Sort By" icon={ArrowUpDown}>
                        <div className="flex gap-2">
                             <div className="relative flex-1">
                                <select 
                                    className="w-full px-2 py-2 bg-hover border border-transparent rounded-md text-xs appearance-none focus:bg-app focus:border-[rgb(var(--c-accent))] outline-none text-main cursor-pointer"
                                    value={orderBy}
                                    onChange={e => onOrderByChange(e.target.value)}
                                >
                                    <option value="">(Default)</option>
                                    {currentEntity.properties.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-muted pointer-events-none" />
                            </div>
                            <button 
                                onClick={() => onOrderByDirChange(orderByDir === 'asc' ? 'desc' : 'asc')}
                                className="px-2 py-1 border border-base rounded-md bg-app hover:bg-hover text-sec text-[10px] font-bold uppercase w-12 transition-colors"
                            >
                                {orderByDir}
                            </button>
                        </div>
                    </ConfigSection>

                    {/* Pagination */}
                    <ConfigSection title="Limit / Skip" icon={Hash}>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <input 
                                    type="number" 
                                    className="w-full px-2 py-1.5 bg-hover border border-transparent rounded-md text-xs focus:bg-app focus:border-[rgb(var(--c-accent))] outline-none text-center font-mono"
                                    placeholder="All"
                                    value={top}
                                    onChange={e => onTopChange(e.target.value ? Number(e.target.value) : '')}
                                />
                                <div className="text-[9px] text-muted text-center mt-1">Top</div>
                            </div>
                            <div>
                                <input 
                                    type="number" 
                                    className="w-full px-2 py-1.5 bg-hover border border-transparent rounded-md text-xs focus:bg-app focus:border-[rgb(var(--c-accent))] outline-none text-center font-mono"
                                    placeholder="0"
                                    value={skip}
                                    onChange={e => onSkipChange(e.target.value ? Number(e.target.value) : '')}
                                />
                                <div className="text-[9px] text-muted text-center mt-1">Skip</div>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-md hover:bg-hover transition-colors">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${count ? 'bg-[rgb(var(--c-accent))] border-[rgb(var(--c-accent))]' : 'border-muted bg-app'}`}>
                                {count && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input 
                                type="checkbox" 
                                checked={count} 
                                onChange={e => onCountChange(e.target.checked)} 
                                className="hidden" 
                            />
                            <span className="text-xs text-sec">Include Count ($inlinecount)</span>
                        </label>
                    </ConfigSection>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Database className="w-8 h-8 mb-2 stroke-1" />
                    <div className="text-center text-muted text-xs">No Entity Selected</div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;