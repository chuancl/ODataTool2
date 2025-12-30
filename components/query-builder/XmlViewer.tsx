import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// --- Types & Helper ---

interface LineInfo {
    start: number;
    end?: number;
}

type LineMap = Map<Node, LineInfo>;

/**
 * 预计算 DOM 树中每个节点的行号
 * 模拟渲染逻辑：
 * 1. 忽略空文本节点
 * 2. Compact 节点 (<tag>text</tag>) 占 1 行
 * 3. 普通节点占 1 行 (Start) + 子节点行数 + 1 行 (End, if has children)
 */
const calculateLineNumbers = (root: Node): LineMap => {
    const map = new Map<Node, LineInfo>();
    let counter = 1;

    const traverse = (node: Node) => {
        // 忽略空文本节点
        if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) return;

        const currentStart = counter;
        let isCompact = false;
        let hasChildren = false;

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            hasChildren = el.childNodes.length > 0;
            // 判断是否为 Compact 模式 (逻辑需与 XmlNode 渲染保持一致)
            isCompact = el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE;
        }

        // 分配起始行号
        // 注意：如果是 Compact 模式，这里分配后 counter++，且不递归子节点（因为子节点文本与父节点在同一行渲染）
        map.set(node, { start: currentStart });
        counter++;

        // 递归处理子节点
        if (node.nodeType === Node.ELEMENT_NODE && !isCompact && hasChildren) {
            const el = node as Element;
            el.childNodes.forEach(child => traverse(child));
            
            // 分配结束行号
            const currentEnd = counter;
            map.get(node)!.end = currentEnd;
            counter++;
        }
    };

    traverse(root);
    return map;
};

// --- Components ---

const Gutter: React.FC<{ num?: number }> = ({ num }) => (
    <div className="w-10 pr-3 text-right text-text-muted/50 select-none text-[10px] leading-5 font-mono shrink-0 border-r border-transparent group-hover:border-border bg-canvas/30">
        {num}
    </div>
);

interface XmlNodeProps {
    node: Node;
    lineMap: LineMap;
    level?: number;
}

const XmlNode: React.FC<XmlNodeProps> = ({ node, lineMap, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);

    const lineInfo = lineMap.get(node);
    // 如果节点没有行号信息（比如是空文本节点），则不渲染
    if (!lineInfo) return null;

    // 缩进控制：使用 Padding 而不是 Margin，保证 Gutter 始终靠左
    const indentStyle = { paddingLeft: `${level * 1.5}rem` };

    // --- 1. Text Node Rendering ---
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (!text) return null;
        return (
            <div className="flex group hover:bg-surface-hover transition-colors">
                <Gutter num={lineInfo.start} />
                <div style={indentStyle} className="flex-1 font-mono text-xs leading-5 break-all text-text-main">
                    {text}
                </div>
            </div>
        );
    }

    // --- 2. Element Node Rendering ---
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as Element;
    const tagName = element.nodeName;
    const attributes = Array.from(element.attributes);
    const hasChildren = element.childNodes.length > 0;
    
    // Check for compact rendering (<tag>text</tag>)
    const isSingleTextNode = element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE;

    return (
        <>
            {/* Start Line (Opening Tag) */}
            <div className="flex group hover:bg-surface-hover transition-colors">
                <Gutter num={lineInfo.start} />
                
                <div style={indentStyle} className="flex-1 flex items-start font-mono text-xs leading-5">
                    {/* Expander Button */}
                    {hasChildren && !isSingleTextNode ? (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
                            className="mr-1 mt-0.5 text-text-muted hover:text-text-main focus:outline-none shrink-0"
                        >
                            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                    ) : (
                        <span className="w-4 inline-block shrink-0"></span>
                    )}

                    {/* Tag Content */}
                    <div className="flex-1 break-all">
                        <span className="text-syntax-tag">&lt;{tagName}</span>
                        {attributes.map(attr => (
                            <span key={attr.name} className="ml-1">
                                <span className="text-syntax-attr">{attr.name}</span>
                                <span className="text-text-muted">=</span>
                                <span className="text-syntax-str">"{attr.value}"</span>
                            </span>
                        ))}
                        
                        {/* Case A: Compact View (<tag>content</tag>) - End tag is on the same line */}
                        {isSingleTextNode && (
                            <span>
                                <span className="text-syntax-tag">&gt;</span>
                                <span className="text-text-main font-medium px-0.5">{element.textContent}</span>
                                <span className="text-syntax-tag">&lt;/{tagName}&gt;</span>
                            </span>
                        )}

                        {/* Case B: Standard View */}
                        {!isSingleTextNode && (
                            <>
                                {hasChildren ? (
                                    <span className="text-syntax-tag">&gt;</span>
                                ) : (
                                    <span className="text-syntax-tag"> /&gt;</span>
                                )}

                                {/* Collapsed Ellipsis */}
                                {hasChildren && !expanded && (
                                    <span 
                                        className="text-text-muted mx-1 cursor-pointer select-none bg-surface-hover px-1 rounded hover:bg-border/50" 
                                        onClick={() => setExpanded(true)}
                                    >
                                        ...
                                    </span>
                                )}

                                {/* Collapsed End Tag (Inline) */}
                                {hasChildren && !expanded && (
                                    <span className="text-syntax-tag">&lt;/{tagName}&gt;</span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Children (Only if expanded and not compact) */}
            {expanded && !isSingleTextNode && hasChildren && (
                <>
                    {Array.from(element.childNodes).map((child, i) => (
                        <XmlNode key={i} node={child} lineMap={lineMap} level={level + 1} />
                    ))}
                </>
            )}

            {/* End Line (Closing Tag) - Only if expanded, not compact, and has children */}
            {expanded && !isSingleTextNode && hasChildren && (
                <div className="flex group hover:bg-surface-hover transition-colors">
                    <Gutter num={lineInfo.end} />
                    <div style={indentStyle} className="flex-1 flex font-mono text-xs leading-5">
                         {/* Spacer for alignment with expander arrow */}
                         <span className="w-4 inline-block shrink-0"></span>
                         <span className="text-syntax-tag">&lt;/{tagName}&gt;</span>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Main Viewer Component ---

const XmlViewer: React.FC<{ xmlString: string }> = ({ xmlString }) => {
    const [xmlDoc, setXmlDoc] = useState<Document | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlString, "text/xml");
            const parseError = doc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                setError(parseError[0].textContent || "XML Parsing Error");
                setXmlDoc(null);
            } else {
                setXmlDoc(doc);
                setError('');
            }
        } catch (e) {
            setError("Failed to parse XML");
        }
    }, [xmlString]);

    // 计算行号 Map
    const lineMap = useMemo(() => {
        if (!xmlDoc) return new Map<Node, LineInfo>();
        return calculateLineNumbers(xmlDoc.documentElement);
    }, [xmlDoc]);

    if (error) return <div className="text-red-500 p-4 font-mono text-xs">{error}</div>;
    if (!xmlDoc) return null;

    return (
        <div className="w-full h-full overflow-auto bg-surface py-2">
             <XmlNode node={xmlDoc.documentElement} lineMap={lineMap} />
        </div>
    );
};

export default XmlViewer;