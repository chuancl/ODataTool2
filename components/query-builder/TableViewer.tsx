import React, { useMemo } from 'react';
import { ChevronRight, Braces, Table as TableIcon } from 'lucide-react';

interface DataCellProps {
    value: any;
    colName: string;
    dataType?: string;
    onDrill: () => void;
}

const DataCell: React.FC<DataCellProps> = ({ value, colName, dataType, onDrill }) => {
    if (value === null || value === undefined) return <span className="text-[var(--text-muted)] italic opacity-50">NULL</span>;
    
    // Array
    if (Array.isArray(value)) {
        return (
            <button onClick={onDrill} className="flex items-center gap-1.5 text-[var(--accent-color)] bg-[var(--accent-bg)] hover:bg-[var(--accent-color)] hover:text-white px-2 py-0.5 rounded border border-[var(--accent-color)]/20 text-[10px] transition-colors whitespace-nowrap">
                <TableIcon className="w-3 h-3" />
                <span>{value.length} items</span>
            </button>
        );
    }
    
    // Object
    if (typeof value === 'object') {
        return (
             <button onClick={onDrill} className="flex items-center gap-1.5 text-[var(--accent-color)] bg-[var(--accent-bg)] hover:bg-[var(--accent-color)] hover:text-white px-2 py-0.5 rounded border border-[var(--accent-color)]/20 text-[10px] transition-colors whitespace-nowrap">
                <Braces className="w-3 h-3" />
                <span>Object</span>
            </button>
        );
    }
    
    const str = String(value);

    // Image
    if (str.startsWith('data:image/')) {
        return <span className="text-[var(--text-secondary)] text-xs italic">[Image Data]</span>;
    }

    // URL
    if (str.startsWith('http')) {
        return (
            <a href={str} target="_blank" rel="noreferrer" className="text-[var(--accent-color)] hover:underline truncate block max-w-[300px]" onClick={e=>e.stopPropagation()}>
                {str}
            </a>
        );
    }
    
    // Boolean
    if (typeof value === 'boolean') {
        return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${value ? 'text-green-600 bg-green-500/10' : 'text-red-600 bg-red-500/10'}`}>{String(value).toUpperCase()}</span>;
    }

    return <span className="text-[var(--text-primary)] text-xs block truncate max-w-[400px]" title={str}>{str}</span>;
};


interface DataTableProps {
    data: any[];
    onDrillDown: (key: string, data: any) => void;
    columnTypes?: Map<string, string>;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDrillDown, columnTypes }) => {
    const safeData = useMemo(() => {
        if (!data) return [];
        return Array.isArray(data) ? data : [data];
    }, [data]);

    if (safeData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] select-none">
                <p className="text-xs">No records</p>
            </div>
        );
    }

    const columns = Array.from(new Set(safeData.flatMap(Object.keys)));

    return (
        // overflow-auto 在父级控制，这里只需要 inline-block 撑开宽度
        <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse">
                <thead className="bg-[var(--bg-sidebar)] sticky top-0 z-10">
                    <tr>
                        <th className="sticky left-0 z-20 bg-[var(--bg-sidebar)] border-b border-r border-[var(--border-color)] px-3 py-2 text-center w-10">
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">#</span>
                        </th>
                        {columns.map(col => (
                            <th key={col} className="bg-[var(--bg-sidebar)] border-b border-r border-[var(--border-color)] px-4 py-2 text-left whitespace-nowrap min-w-[120px]">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-[var(--text-secondary)]">{col}</span>
                                    {columnTypes?.get(col) && <span className="text-[9px] font-normal text-[var(--text-muted)] font-mono">{columnTypes.get(col)}</span>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-[var(--bg-panel)]">
                    {safeData.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-[var(--bg-sidebar)] transition-colors group">
                            <td className="sticky left-0 z-10 bg-[var(--bg-panel)] group-hover:bg-[var(--bg-sidebar)] border-b border-r border-[var(--border-color)] px-2 py-1.5 text-center text-[10px] font-mono text-[var(--text-muted)]">
                                {rowIdx + 1}
                            </td>
                            {columns.map(col => (
                                <td key={col} className="border-b border-r border-[var(--border-color)] px-4 py-1.5 whitespace-nowrap">
                                    <DataCell 
                                        value={row[col]} 
                                        colName={col}
                                        dataType={columnTypes?.get(col)}
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