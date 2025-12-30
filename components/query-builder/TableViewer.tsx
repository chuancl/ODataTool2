import React, { useMemo } from 'react';
import { ChevronRight, Braces, Table as TableIcon } from 'lucide-react';

interface DataCellProps {
    value: any;
    colName: string;
    dataType?: string;
    onDrill: () => void;
}

const DataCell: React.FC<DataCellProps> = ({ value, colName, dataType, onDrill }) => {
    if (value === null || value === undefined) return <span className="text-muted italic opacity-40 text-[10px]">null</span>;
    
    // Array
    if (Array.isArray(value)) {
        return (
            <button onClick={onDrill} className="group flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-hover hover:bg-[rgb(var(--c-accent-subtle))] transition-colors border border-transparent hover:border-[rgb(var(--c-accent))]/30">
                <div className="bg-white dark:bg-black rounded-full p-0.5 shadow-sm text-sec group-hover:text-[rgb(var(--c-accent))]">
                    <TableIcon className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-medium text-sec group-hover:text-[rgb(var(--c-accent))]">{value.length} items</span>
            </button>
        );
    }
    
    // Object
    if (typeof value === 'object') {
        return (
             <button onClick={onDrill} className="group flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-hover hover:bg-[rgb(var(--c-accent-subtle))] transition-colors border border-transparent hover:border-[rgb(var(--c-accent))]/30">
                <div className="bg-white dark:bg-black rounded-full p-0.5 shadow-sm text-sec group-hover:text-[rgb(var(--c-accent))]">
                    <Braces className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-medium text-sec group-hover:text-[rgb(var(--c-accent))]">Object</span>
            </button>
        );
    }
    
    const str = String(value);

    // Image
    if (str.startsWith('data:image/')) {
        return <span className="text-sec text-xs italic opacity-80">[Image]</span>;
    }

    // URL
    if (str.startsWith('http')) {
        return (
            <a href={str} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline truncate block max-w-[300px]" onClick={e=>e.stopPropagation()}>
                {str}
            </a>
        );
    }
    
    // Boolean
    if (typeof value === 'boolean') {
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${value ? 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'}`}>{String(value).toUpperCase()}</span>;
    }

    return <span className="text-main text-xs block truncate max-w-[400px] font-mono leading-relaxed" title={str}>{str}</span>;
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
            <div className="flex flex-col items-center justify-center h-full text-muted select-none">
                <p className="text-xs">No records found</p>
            </div>
        );
    }

    const columns = Array.from(new Set(safeData.flatMap(Object.keys)));

    return (
        <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse">
                <thead className="bg-sidebar sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="sticky left-0 z-20 bg-sidebar border-b border-base px-3 py-3 text-center w-10">
                            <span className="text-[10px] font-bold text-muted">#</span>
                        </th>
                        {columns.map(col => (
                            <th key={col} className="bg-sidebar border-b border-base px-4 py-3 text-left whitespace-nowrap min-w-[120px]">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-bold text-sec">{col}</span>
                                    {columnTypes?.get(col) && <span className="text-[9px] font-normal text-muted font-mono">{columnTypes.get(col)}</span>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-app divide-y divide-base/50">
                    {safeData.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-hover transition-colors group">
                            <td className="sticky left-0 z-10 bg-app group-hover:bg-hover border-b border-base px-2 py-2 text-center text-[10px] font-mono text-muted border-r-2 border-r-transparent group-hover:border-r-[rgb(var(--c-accent))]">
                                {rowIdx + 1}
                            </td>
                            {columns.map(col => (
                                <td key={col} className="border-b border-base/50 px-4 py-2 whitespace-nowrap">
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