import React, { useMemo, useState } from 'react';
import { 
    useReactTable, 
    getCoreRowModel, 
    getSortedRowModel, 
    flexRender, 
    ColumnDef,
    SortingState,
    Header
} from '@tanstack/react-table';
import { ChevronRight, Braces, Table as TableIcon, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Chip, Link } from '@heroui/react';

// --- Cell Renderer Component ---

interface DataCellProps {
    value: any;
    colName: string;
    dataType?: string;
    onDrill: () => void;
}

const DataCell: React.FC<DataCellProps> = ({ value, colName, dataType, onDrill }) => {
    if (value === null || value === undefined) return <span className="text-default-300 italic text-[11px]">null</span>;
    
    // Array
    if (Array.isArray(value)) {
        return (
            <Chip 
                size="sm" 
                variant="flat" 
                color="primary" 
                startContent={<TableIcon className="w-3 h-3 ml-1" />}
                className="cursor-pointer hover:bg-primary/20 transition-colors h-6"
                onClick={onDrill}
            >
                {value.length} items
            </Chip>
        );
    }
    
    // Object
    if (typeof value === 'object') {
        return (
            <Chip 
                size="sm" 
                variant="flat" 
                color="secondary" 
                startContent={<Braces className="w-3 h-3 ml-1" />}
                className="cursor-pointer hover:bg-secondary/20 transition-colors h-6"
                onClick={onDrill}
            >
                Object
            </Chip>
        );
    }
    
    const str = String(value);

    if (str.startsWith('data:image/')) {
        return <span className="text-default-400 text-xs italic">[Image]</span>;
    }

    if (str.startsWith('http')) {
        return (
            <Link 
                isExternal 
                href={str} 
                size="sm"
                className="truncate block max-w-full" 
                onClick={e => e.stopPropagation()}
            >
                {str}
            </Link>
        );
    }
    
    if (typeof value === 'boolean') {
        return (
            <Chip 
                size="sm" 
                variant="flat" 
                color={value ? "success" : "danger"} 
                classNames={{ content: "font-bold text-[10px]" }}
                className="h-5"
            >
                {String(value).toUpperCase()}
            </Chip>
        );
    }

    return <span className="text-foreground text-sm block truncate font-mono leading-relaxed" title={str}>{str}</span>;
};


// --- Main Table Component ---

interface DataTableProps {
    data: any[];
    onDrillDown: (key: string, data: any) => void;
    columnTypes?: Map<string, string>;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDrillDown, columnTypes }) => {
    const [sorting, setSorting] = useState<SortingState>([]);

    const safeData = useMemo(() => {
        if (!data) return [];
        return Array.isArray(data) ? data : [data];
    }, [data]);

    // 动态生成列定义
    const columns = useMemo<ColumnDef<any>[]>(() => {
        if (safeData.length === 0) return [];
        
        // 获取所有可能的键
        const keys = Array.from(new Set(safeData.flatMap(Object.keys)));
        
        const generatedCols: ColumnDef<any>[] = keys.map(key => ({
            accessorKey: key,
            header: key,
            cell: info => (
                <DataCell 
                    value={info.getValue()} 
                    colName={key} 
                    dataType={columnTypes?.get(key)} 
                    onDrill={() => onDrillDown(`${key} [${info.row.index}]`, info.getValue())} 
                />
            ),
            size: 150, // 默认宽度
            minSize: 80,
            maxSize: 600,
        }));

        // 添加序号列
        const indexCol: ColumnDef<any> = {
            id: 'index',
            header: '#',
            size: 50,
            enableSorting: false,
            enableResizing: false,
            cell: info => (
                <span className="text-tiny font-mono text-default-400">
                    {info.row.index + 1}
                </span>
            ),
        };

        return [indexCol, ...generatedCols];
    }, [safeData, columnTypes, onDrillDown]);

    const table = useReactTable({
        data: safeData,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: 'onChange', // 实时调整列宽
        defaultColumn: {
            minSize: 60,
            maxSize: 800,
        },
    });

    if (safeData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-default-400 select-none">
                <p className="text-small">No records found</p>
            </div>
        );
    }

    return (
        <div className="odata-table-container">
            <table className="odata-table" style={{ width: table.getTotalSize() }}>
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th 
                                    key={header.id} 
                                    className={`relative group select-none ${header.column.getCanSort() ? 'cursor-pointer hover:bg-default-200/50' : ''}`}
                                    style={{ 
                                        width: header.getSize(),
                                        // 序号列特殊处理粘性定位
                                        ...(header.id === 'index' ? { position: 'sticky', left: 0, zIndex: 30, background: 'hsl(var(--heroui-default-100))' } : {})
                                    }}
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    <div className="flex items-center justify-between gap-1 overflow-hidden h-full">
                                        <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                                            <span className="text-small font-bold text-foreground truncate" title={header.id === 'index' ? '' : String(header.column.columnDef.header)}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </span>
                                            {header.id !== 'index' && columnTypes?.get(header.id) && (
                                                <span className="text-[10px] font-normal text-default-400 font-mono truncate">
                                                    {columnTypes.get(header.id)}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Sort Indicator */}
                                        {header.column.getCanSort() && (
                                            <div className={`text-default-400 transition-opacity ${header.column.getIsSorted() ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                                                {{
                                                    asc: <ArrowUp className="w-3 h-3" />,
                                                    desc: <ArrowDown className="w-3 h-3" />,
                                                }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="w-3 h-3" />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Resizer Handle */}
                                    {header.column.getCanResize() && (
                                        <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            onClick={(e) => e.stopPropagation()} // 防止触发排序
                                            className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors ${
                                                header.column.getIsResizing() ? 'bg-primary' : 'hover:bg-primary/50'
                                            }`}
                                        />
                                    )}
                                th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="group">
                            {row.getVisibleCells().map(cell => (
                                <td 
                                    key={cell.id} 
                                    style={{ 
                                        width: cell.column.getSize(),
                                        // 序号列特殊处理粘性定位
                                        ...(cell.column.id === 'index' ? { 
                                            position: 'sticky', 
                                            left: 0, 
                                            zIndex: 10, 
                                            backgroundColor: 'hsl(var(--heroui-background))',
                                            borderRight: '2px solid transparent'
                                        } : {})
                                    }}
                                    className={cell.column.id === 'index' ? "text-center !border-r-transparent group-hover:!border-r-primary transition-colors !bg-background group-hover:!bg-default-100/50" : ""}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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