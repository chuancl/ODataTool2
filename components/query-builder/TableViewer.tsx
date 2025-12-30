import React, { useMemo } from 'react';
import { ChevronRight, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface DataCellProps {
    value: any;
    colName: string;
    onDrill: () => void;
}

const DataCell: React.FC<DataCellProps> = ({ value, colName, onDrill }) => {
    if (value === null || value === undefined) return <span className="text-zinc-300 text-xs">-</span>;
    
    // Array
    if (Array.isArray(value)) {
        return (
            <button onClick={onDrill} className="group inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-full transition-colors">
                <span>{value.length} items</span>
                <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </button>
        );
    }
    
    // Object
    if (typeof value === 'object') {
        return (
             <button onClick={onDrill} className="group inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-full transition-colors">
                <span>Object</span>
                <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </button>
        );
    }
    
    const str = String(value);

    // Base64 Image
    if (str.startsWith('data:image/')) {
        return (
            <div className="group relative inline-block">
                <div className="flex items-center gap-1 text-xs text-zinc-500 cursor-zoom-in hover:text-violet-600">
                    <ImageIcon className="w-3 h-3" /> Image
                </div>
                <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 p-2 bg-white rounded-xl shadow-xl border border-zinc-100">
                    <img src={str} alt="Preview" className="h-32 w-auto object-contain rounded-lg" />
                </div>
            </div>
        );
    }

    // URL
    if (str.startsWith('http')) {
        return (
            <a href={str} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 hover:underline max-w-[250px]" onClick={e=>e.stopPropagation()}>
                <span className="truncate">{str}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
            </a>
        );
    }
    
    // Boolean
    if (typeof value === 'boolean') {
        return (
            <div className="flex items-center">
                 <div className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                 <span className="text-xs font-medium text-[var(--text-main)]">{String(value)}</span>
            </div>
        );
    }

    // Number
    if (typeof value === 'number') {
        return <span className="text-blue-600 font-mono text-sm">{value}</span>;
    }

    // String
    return <span className="text-[var(--text-main)] text-sm whitespace-nowrap block truncate max-w-[350px]" title={str}>{str}</span>;
};

interface DataTableProps {
    data: any;
    onDrillDown: (key: string, data: any) => void;
    columnTypes?: Map<string, string>;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDrillDown, columnTypes }) => {
    const safeData = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        return [data];
    }, [data]);

    if (safeData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 select-none p-10">
                <p className="text-sm">No records returned</p>
            </div>
        );
    }

    const columns = Array.from(new Set(safeData.flatMap(Object.keys)));

    return (
        <div className="min-w-full inline-block align-top pb-10">
            <table className="min-w-full border-collapse">
                <thead className="sticky top-0 z-10">
                    <tr>
                        <th className="sticky left-0 z-20 bg-[var(--bg-surface)] border-b border-[var(--border-light)] w-12 px-4 py-3 text-center">
                            <span className="text-xs font-bold text-[var(--text-muted)]">#</span>
                        </th>
                        {columns.map(col => (
                            <th key={col} className="bg-[var(--bg-surface)] border-b border-[var(--border-light)] px-6 py-3 text-left">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">{col}</span>
                                    {columnTypes?.get(col) && <span className="text-[10px] font-normal text-zinc-400 font-mono mt-0.5">{columnTypes.get(col)}</span>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-[var(--bg-surface)]">
                    {safeData.map((row, rowIdx) => (
                        <tr key={rowIdx} className="group hover:bg-[var(--bg-page)] transition-colors">
                            <td className="sticky left-0 z-10 bg-[var(--bg-surface)] group-hover:bg-[var(--bg-page)] border-b border-[var(--border-light)] px-4 py-3 text-center text-xs font-mono text-[var(--text-muted)]">
                                {rowIdx + 1}
                            </td>
                            {columns.map(col => (
                                <td key={col} className="border-b border-[var(--border-light)] px-6 py-3">
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