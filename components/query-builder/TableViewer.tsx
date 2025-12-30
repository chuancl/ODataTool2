import React from 'react';
import { Table as TableIcon, ChevronRight, Braces, List, Image as ImageIcon, Film, Binary } from 'lucide-react';
import { cleanBase64 } from './utils';

// --- DataCell Component ---
interface DataCellProps {
    value: any;
    colName: string;
    dataType?: string;
    onDrill: () => void;
}

const DataCell: React.FC<DataCellProps> = ({ value, colName, dataType, onDrill }) => {
    if (value === null || value === undefined) return <span className="text-text-muted italic opacity-50 font-bold">NULL</span>;
    
    // Array
    if (Array.isArray(value)) {
        return (
            <button onClick={onDrill} className="flex items-center gap-2 text-brand bg-brand/10 hover:bg-brand hover:text-brand-fg px-3 py-1.5 rounded-xl transition-all border-2 border-brand/20 font-black uppercase text-[11px] tracking-widest shadow-sm">
                <TableIcon className="w-4 h-4" />
                <span>{value.length} 项数据</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        );
    }
    
    // Object
    if (typeof value === 'object') {
        return (
             <button onClick={onDrill} className="flex items-center gap-2 text-brand bg-brand/10 hover:bg-brand hover:text-brand-fg px-3 py-1.5 rounded-xl transition-all border-2 border-brand/20 font-black uppercase text-[11px] tracking-widest shadow-sm">
                <Braces className="w-4 h-4" />
                <span>复杂对象</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        );
    }
    
    const str = String(value);

    // 1. Known Base64 Image Prefix
    if (str.startsWith('data:image/')) {
        return (
            <div className="group relative inline-block">
                <img src={str} alt="Base64 Preview" className="h-12 w-auto object-contain border-2 border-border rounded-xl bg-canvas hover:scale-[4] hover:shadow-2xl hover:z-50 transition-all origin-left duration-300 ease-out cursor-zoom-in" />
            </div>
        );
    }

    // 2. URL Detection
    if (str.startsWith('http') || str.startsWith('/')) {
        return (
            <a href={str} target="_blank" rel="noreferrer" className="text-brand hover:text-brand-hover hover:underline break-all transition-colors font-bold underline-offset-4" onClick={e=>e.stopPropagation()}>
                {str}
            </a>
        );
    }
    
    // Boolean
    if (typeof value === 'boolean') {
        return <span className={`text-xs font-black px-3 py-1 rounded-lg border-2 shadow-sm ${value ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>{String(value).toUpperCase()}</span>;
    }

    // Number
    if (typeof value === 'number') {
        return <span className="text-syntax-num font-mono font-bold text-sm">{value}</span>;
    }

    // Default String
    return <span className="text-text-main font-bold text-sm whitespace-pre-wrap leading-relaxed">{str}</span>;
};


interface DataTableProps {
    data: any[];
    onDrillDown: (key: string, data: any) => void;
    columnTypes?: Map<string, string>;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDrillDown, columnTypes }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-20 text-text-muted select-none">
                <List className="w-24 h-24 mb-6 opacity-10" />
                <p className="text-sm font-black uppercase tracking-widest">暂无可用数据记录</p>
            </div>
        );
    }

    const columns = Array.from(new Set(data.flatMap(Object.keys)));

    return (
        <div className="min-w-full inline-block align-middle">
            <div className="border-b-2 border-border">
                <table className="min-w-full divide-y-2 divide-border">
                    <thead className="bg-surface sticky top-0 z-10 shadow-lg">
                        <tr>
                            <th scope="col" className="px-6 py-5 text-left text-xs font-black text-text-main uppercase tracking-[0.2em] w-16 border-r-2 border-border bg-surface">
                                #
                            </th>
                            {columns.map(col => {
                                const type = columnTypes?.get(col);
                                return (
                                    <th key={col} scope="col" className="px-6 py-5 text-left text-sm font-black text-text-main uppercase tracking-widest border-r-2 border-border last:border-0 min-w-[150px] bg-surface">
                                        <div className="flex items-center gap-3">
                                            {col}
                                            {type && <span className="text-[10px] font-black normal-case px-2 py-0.5 rounded-lg bg-border text-text-muted border border-border shadow-sm">{type}</span>}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-canvas divide-y-2 divide-border">
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-brand/5 transition-colors group">
                                <td className="px-6 py-6 whitespace-nowrap text-sm text-text-muted font-black border-r-2 border-border bg-surface group-hover:bg-brand/10 sticky left-0 z-0 shadow-sm">
                                    {rowIdx + 1}
                                </td>
                                {columns.map(col => (
                                    <td key={col} className="px-6 py-6 text-sm border-r-2 border-border last:border-0 max-w-sm break-words relative">
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
             <div className="p-6 text-sm font-black text-text-main text-right bg-surface border-t-2 border-border sticky bottom-0 shadow-2xl">
                当前数据集共显示 {data.length} 条记录
            </div>
        </div>
    );
};

export default DataTable;