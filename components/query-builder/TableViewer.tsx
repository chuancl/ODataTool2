import React from 'react';
import { ChevronRight, Braces, List, ExternalLink } from 'lucide-react';

interface DataCellProps {
    value: any;
    colName: string;
    onDrill: () => void;
}

const DataCell: React.FC<DataCellProps> = ({ value, colName, onDrill }) => {
    if (value === null || value === undefined) return <span className="text-gray-300 text-[11px] italic">null</span>;
    
    // Array
    if (Array.isArray(value)) {
        return (
            <button onClick={onDrill} className="inline-flex items-center gap-1 text-[10px] font-medium text-brand bg-brand/5 hover:bg-brand/10 px-1.5 py-0.5 rounded border border-brand/20 transition-colors">
                <span>Array({value.length})</span>
                <ChevronRight className="w-3 h-3" />
            </button>
        );
    }
    
    // Object
    if (typeof value === 'object') {
        return (
             <button onClick={onDrill} className="inline-flex items-center gap-1 text-[10px] font-medium text-brand bg-brand/5 hover:bg-brand/10 px-1.5 py-0.5 rounded border border-brand/20 transition-colors">
                <span>Object</span>
                <ChevronRight className="w-3 h-3" />
            </button>
        );
    }
    
    const str = String(value);

    // Base64 Image
    if (str.startsWith('data:image/')) {
        return (
            <div className="group relative">
                <span className="text-[10px] text-text-muted cursor-help underline decoration-dashed">Base64 Image</span>
                <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50">
                    <img src={str} alt="Preview" className="h-20 w-auto object-contain bg-white border border-gray-200 shadow-lg rounded" />
                </div>
            </div>
        );
    }

    // URL
    if (str.startsWith('http')) {
        return (
            <a href={str} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand hover:underline max-w-[200px] truncate" onClick={e=>e.stopPropagation()}>
                <span className="truncate">{str}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
            </a>
        );
    }
    
    // Boolean
    if (typeof value === 'boolean') {
        return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${value ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>{String(value)}</span>;
    }

    // Number
    if (typeof value === 'number') {
        return <span className="text-blue-600 font-mono text-xs">{value}</span>;
    }

    // String
    return <span className="text-text-main text-xs whitespace-nowrap" title={str}>{str}</span>;
};

interface DataTableProps {
    data: any[];
    onDrillDown: (key: string, data: any) => void;
    columnTypes?: Map<string, string>;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDrillDown, columnTypes }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <List className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-xs">No data returned</p>
            </div>
        );
    }

    const columns = Array.from(new Set(data.flatMap(Object.keys)));

    return (
        <div className="w-full inline-block align-top">
            <table className="min-w-full divide-y divide-border border-b border-border">
                <thead className="bg-surface-muted sticky top-0 z-10">
                    <tr>
                        <th scope="col" className="px-3 py-2 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider w-10 border-r border-border bg-surface-muted sticky left-0 z-20">
                            #
                        </th>
                        {columns.map(col => (
                            <th key={col} scope="col" className="px-3 py-2 text-left text-[11px] font-bold text-text-sec uppercase tracking-wide border-r border-border whitespace-nowrap min-w-[100px] bg-surface-muted">
                                {col}
                                {columnTypes?.get(col) && <span className="ml-1 text-[9px] font-normal text-text-muted normal-case bg-slate-200/50 px-1 rounded">{columnTypes.get(col)}</span>}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                    {data.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-3 py-1.5 whitespace-nowrap text-[10px] text-text-muted font-mono border-r border-border bg-surface sticky left-0 z-10 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                                {rowIdx + 1}
                            </td>
                            {columns.map(col => (
                                <td key={col} className="px-3 py-1.5 text-xs border-r border-border last:border-0 max-w-xs whitespace-nowrap overflow-hidden">
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