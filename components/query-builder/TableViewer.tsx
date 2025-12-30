import React, { useMemo } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';

interface DataCellProps {
    value: any;
    colName: string;
    onDrill: () => void;
}

const DataCell: React.FC<DataCellProps> = ({ value, colName, onDrill }) => {
    if (value === null || value === undefined) return <span className="text-[var(--text-muted)] text-xs italic">null</span>;
    
    // Array
    if (Array.isArray(value)) {
        return (
            <button onClick={onDrill} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] bg-[var(--accent-surface)] hover:bg-[var(--accent-primary)] hover:text-white px-2 py-0.5 rounded border border-[var(--accent-primary)]/20 transition-colors">
                <span>[{value.length}]</span>
                <ChevronRight className="w-3.5 h-3.5" />
            </button>
        );
    }
    
    // Object
    if (typeof value === 'object') {
        return (
             <button onClick={onDrill} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] bg-[var(--accent-surface)] hover:bg-[var(--accent-primary)] hover:text-white px-2 py-0.5 rounded border border-[var(--accent-primary)]/20 transition-colors">
                <span>{`{}`}</span>
                <ChevronRight className="w-3.5 h-3.5" />
            </button>
        );
    }
    
    const str = String(value);

    // Base64 Image
    if (str.startsWith('data:image/')) {
        return (
            <div className="group relative">
                <span className="text-xs text-[var(--text-muted)] cursor-help underline decoration-dashed">Image</span>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50">
                    <img src={str} alt="Preview" className="h-24 w-auto object-contain bg-[var(--bg-panel)] border border-[var(--border-strong)] shadow-lg rounded" />
                </div>
            </div>
        );
    }

    // URL
    if (str.startsWith('http')) {
        return (
            <a href={str} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--accent-text)] hover:underline max-w-[300px]" onClick={e=>e.stopPropagation()}>
                <span className="truncate">{str}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50" />
            </a>
        );
    }
    
    // Boolean
    if (typeof value === 'boolean') {
        return <span className={`text-xs font-bold px-2 py-0.5 rounded ${value ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>{String(value).toUpperCase()}</span>;
    }

    // Number
    if (typeof value === 'number') {
        return <span className="text-[var(--sh-num)] font-mono text-sm">{value}</span>;
    }

    // String
    return <span className="text-[var(--text-primary)] text-sm whitespace-nowrap block truncate max-w-[400px]" title={str}>{str}</span>;
};

interface DataTableProps {
    data: any;
    onDrillDown: (key: string, data: any) => void;
    columnTypes?: Map<string, string>;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDrillDown, columnTypes }) => {
    // 修复：确保 safeData 始终是数组，防止 flatMap 报错
    const safeData = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        return [data];
    }, [data]);

    if (safeData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] select-none">
                <p className="text-sm">No records found</p>
            </div>
        );
    }

    const columns = Array.from(new Set(safeData.flatMap(Object.keys)));

    return (
        <div className="min-w-full inline-block align-top">
            <table className="min-w-full border-collapse border-0">
                <thead className="bg-[var(--bg-app)] sticky top-0 z-10 shadow-[0_1px_0_var(--border-subtle)]">
                    <tr>
                        {/* Sticky Row Number Column */}
                        <th className="sticky left-0 z-20 bg-[var(--bg-app)] border-r border-b border-[var(--border-strong)] w-12 px-2 py-2 text-center">
                            <span className="text-xs font-bold text-[var(--text-muted)]">#</span>
                        </th>
                        {columns.map(col => (
                            <th key={col} className="border-r border-b border-[var(--border-subtle)] px-4 py-2 text-left bg-[var(--bg-app)]">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap">{col}</span>
                                    {columnTypes?.get(col) && <span className="text-[10px] font-normal text-[var(--text-muted)] font-mono">{columnTypes.get(col)}</span>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-[var(--bg-panel)]">
                    {safeData.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-[var(--bg-app)] transition-colors group">
                            {/* Sticky Row Number Cell */}
                            <td className="sticky left-0 z-10 bg-[var(--bg-panel)] group-hover:bg-[var(--bg-app)] border-r border-b border-[var(--border-subtle)] px-2 py-2 text-center text-xs font-mono text-[var(--text-muted)]">
                                {rowIdx + 1}
                            </td>
                            {columns.map(col => (
                                <td key={col} className="border-r border-b border-[var(--border-subtle)] px-4 py-2">
                                    <DataCell 
                                        value={row[col]} 
                                        colName={col}
                                        onDrill={() => onDrillDown(`${col} [${rowIdx}]`, row[col])} 
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;