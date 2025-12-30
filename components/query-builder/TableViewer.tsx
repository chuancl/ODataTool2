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
    if (value === null || value === undefined) return <span className="text-text-muted italic">null</span>;
    
    // Array
    if (Array.isArray(value)) {
        return (
            <button onClick={onDrill} className="flex items-center gap-1.5 text-brand hover:bg-brand/10 px-2 py-0.5 rounded transition border border-transparent hover:border-brand/20 group">
                <TableIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">{value.length}</span>
                <span className="opacity-70 text-[10px] uppercase tracking-wider">items</span>
                <ChevronRight className="w-3 h-3 opacity-50 ml-0.5" />
            </button>
        );
    }
    
    // Object
    if (typeof value === 'object') {
        return (
             <button onClick={onDrill} className="flex items-center gap-1.5 text-brand hover:bg-brand/10 px-2 py-0.5 rounded transition border border-transparent hover:border-brand/20 group">
                <Braces className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Object</span>
                <ChevronRight className="w-3 h-3 opacity-50 ml-0.5" />
            </button>
        );
    }
    
    const str = String(value);

    // 1. Known Base64 Image Prefix
    if (str.startsWith('data:image/')) {
        return (
            <div className="group relative inline-block">
                <img src={str} alt="Base64 Preview" className="h-8 w-auto object-contain border border-border rounded bg-canvas hover:scale-[4] hover:shadow-2xl hover:z-50 transition-all origin-left duration-200 ease-out cursor-zoom-in" />
            </div>
        );
    }

    // 2. URL Image/Video Detection
    if (str.startsWith('http') || str.startsWith('/')) {
        const lowerStr = str.toLowerCase();
        const isImg = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(lowerStr);
        const isVideo = /\.(mp4|webm|ogg|mov)$/.test(lowerStr);

        if (isImg) {
            return (
                <div className="flex flex-col items-start gap-1">
                    <a href={str} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded border border-border">
                         <img src={str} alt="Preview" className="h-10 w-auto object-cover transition-transform group-hover:scale-110" />
                         <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ImageIcon className="w-3 h-3 text-white" />
                         </div>
                    </a>
                    <a href={str} target="_blank" rel="noreferrer" className="text-brand hover:underline text-[10px] truncate max-w-[150px] block opacity-70 hover:opacity-100" onClick={e=>e.stopPropagation()}>{str}</a>
                </div>
            )
        }
        
        if (isVideo) {
             return (
                <div className="flex flex-col items-start gap-1">
                    <div className="relative border border-border rounded bg-black overflow-hidden shadow-sm max-w-[120px] group cursor-pointer">
                         <video src={str} className="h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="bg-black/50 rounded-full p-1 text-white backdrop-blur-sm">
                                <Film className="w-3 h-3" />
                             </div>
                         </div>
                    </div>
                     <a href={str} target="_blank" rel="noreferrer" className="text-brand hover:underline text-[10px] truncate max-w-[200px] flex items-center gap-1 opacity-70 hover:opacity-100" onClick={e=>e.stopPropagation()}>
                        {str}
                     </a>
                </div>
            )
        }
        
        // Normal Link
        return (
            <a href={str} target="_blank" rel="noreferrer" className="text-brand hover:text-brand-hover hover:underline break-all transition-colors" onClick={e=>e.stopPropagation()}>
                {str}
            </a>
        );
    }
    
    // Boolean
    if (typeof value === 'boolean') {
        return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${value ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{String(value)}</span>;
    }

    // Number
    if (typeof value === 'number') {
        return <span className="text-syntax-num font-mono">{value}</span>;
    }

    // Default String
    if (str.length > 200) {
        return <span className="text-text-main line-clamp-3 min-w-[200px]" title={str}>{str}</span>;
    }

    return <span className="text-text-main whitespace-pre-wrap">{str}</span>;
};


interface DataTableProps {
    data: any[];
    onDrillDown: (key: string, data: any) => void;
    columnTypes?: Map<string, string>;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDrillDown, columnTypes }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-text-muted select-none">
                <List className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Empty Result Set</p>
            </div>
        );
    }

    const columns = Array.from(new Set(data.flatMap(Object.keys)));

    return (
        <div className="min-w-full inline-block align-middle">
            <div className="border-b border-border">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surface-hover sticky top-0 z-10 backdrop-blur-md bg-opacity-90 shadow-sm">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider w-12 border-r border-border/50">
                                #
                            </th>
                            {columns.map(col => {
                                const type = columnTypes?.get(col);
                                return (
                                    <th key={col} scope="col" className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider border-r border-border/50 last:border-0 min-w-[100px]">
                                        <div className="flex items-center gap-1.5">
                                            {col}
                                            {type && <span className="text-[9px] font-normal normal-case px-1.5 py-0.5 rounded bg-border text-text-muted opacity-80">{type}</span>}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border">
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-surface-hover/50 transition-colors group">
                                <td className="px-4 py-3 whitespace-nowrap text-xs text-text-muted font-mono border-r border-border/50 bg-surface group-hover:bg-surface-hover/50 sticky left-0 z-0">
                                    {rowIdx + 1}
                                </td>
                                {columns.map(col => (
                                    <td key={col} className="px-4 py-3 text-xs border-r border-border/50 last:border-0 max-w-xs break-words relative">
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
             <div className="p-2 text-[10px] text-text-muted text-right bg-surface border-t border-border sticky bottom-0">
                Showing {data.length} rows
            </div>
        </div>
    );
};

export default DataTable;