import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const LineContent = ({ name, value, type, isLast }: any) => (
    <div className="font-mono text-xs leading-5 pl-5">
        {name && <span className="text-syntax-key mr-1">"{name}":</span>}
        <span className={`
            ${type === 'string' ? 'text-syntax-str break-all whitespace-pre-wrap' : ''}
            ${type === 'number' ? 'text-syntax-num' : ''}
            ${type === 'boolean' ? 'text-syntax-bool font-bold' : ''}
            ${type === 'null' ? 'text-syntax-comment italic' : ''}
            ${type === 'plain' ? 'text-text-main' : ''}
        `}>{value}</span>
        {!isLast && <span className="text-text-muted">,</span>}
    </div>
);

const JsonNode: React.FC<{ name?: string; value: any; isLast?: boolean; level?: number }> = ({ name, value, isLast, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    
    // 基础类型渲染
    if (value === null) return <LineContent name={name} value="null" type="null" isLast={isLast} />;
    if (typeof value === 'boolean') return <LineContent name={name} value={String(value)} type="boolean" isLast={isLast} />;
    if (typeof value === 'number') return <LineContent name={name} value={value} type="number" isLast={isLast} />;
    if (typeof value === 'string') return <LineContent name={name} value={`"${value}"`} type="string" isLast={isLast} />;

    // 复杂类型 (Object / Array)
    const isArray = Array.isArray(value);
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';
    const itemCount = isArray ? value.length : keys.length;

    if (isEmpty) return <LineContent name={name} value={`${openBracket}${closeBracket}`} type="plain" isLast={isLast} />;

    return (
        <div className="font-mono text-xs leading-5 text-text-main">
            <div className="flex items-start">
                <button 
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
                    className="mr-1 mt-0.5 text-text-muted hover:text-text-main focus:outline-none shrink-0"
                >
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                <div className="flex-1">
                    {name && <span className="text-syntax-key mr-1">"{name}":</span>}
                    <span className="text-text-main font-bold">{openBracket}</span>
                    
                    {!expanded && (
                        <span className="text-text-muted mx-1 cursor-pointer select-none hover:text-text-main bg-surface-hover px-1 rounded" onClick={() => setExpanded(true)}>
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                    )}

                    {expanded && (
                        <div className="pl-4 border-l border-border ml-1.5 my-0.5">
                            {keys.map((key, idx) => (
                                <JsonNode 
                                    key={key} 
                                    name={isArray ? undefined : key} 
                                    value={value[key]} 
                                    isLast={idx === keys.length - 1} 
                                    level={level + 1}
                                />
                            ))}
                        </div>
                    )}

                    <div className={expanded ? "" : "inline"}>
                        <span className="text-text-main font-bold">{closeBracket}</span>
                        {!isLast && <span className="text-text-muted">,</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonNode;