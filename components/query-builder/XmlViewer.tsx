import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// --- Types & Helper ---

interface LineInfo {
    start: number;
    end?: number;
}

type LineMap = Map<Node, LineInfo>;

const calculateLineNumbers = (root: Node): LineMap => {
    const map = new Map<Node, LineInfo>();
    let counter = 1;

    const traverse = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) return;
        const currentStart = counter;
        let isCompact = false;
        let hasChildren = false;

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            hasChildren = el.childNodes.length > 0;
            isCompact = el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE;
        }

        map.set(node, { start: currentStart });
        counter++;

        if (node.nodeType === Node.ELEMENT_NODE && !isCompact && hasChildren) {
            const el = node as Element;
            el.childNodes.forEach(child => traverse(child));
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
    <div className="w-10 pr-3 text-right text-text-muted/40 select-none text-[10px] leading-6 font-mono shrink-0 border-r border-border bg-canvas/20">
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
    if (!lineInfo) return null;

    const indentStyle = { paddingLeft: `${level * 1.5}rem` };

    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (!text) return null;
        return (
            <div className="flex group hover:bg-surface-hover transition-colors">
                <Gutter num={lineInfo.start} />
                <div style={indentStyle} className="flex-1 font-mono text-xs leading-6 break-all text-text-main py-0 px-4">
                    {text}
                </div>
            </div>
        );
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as Element;
    const tagName = element.nodeName;
    const attributes = Array.from(element.attributes);
    const hasChildren = element.childNodes.length > 0;
    const isSingleTextNode = element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE;

    return (
        <>
            <div className="flex group hover:bg-surface-hover transition-colors">
                <Gutter num={lineInfo.start} />
                <div style={indentStyle} className="flex-1 flex items-start font-mono text-xs leading-6 px-2">
                    {hasChildren && !isSingleTextNode ? (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
                            className="mr-1 mt-1 text-text-muted hover:text-brand focus:outline-none shrink-0"
                        >
                            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                    ) : (
                        <span className="w-4.5 inline-block shrink-0"></span>
                    )}

                    <div className="flex-1 break-all">
                        <span className="text-syntax-tag font-bold">&lt;{tagName}</span>
                        {attributes.map(attr => (
                            <span key={attr.name} className="ml-1.5">
                                <span className="text-syntax-attr">{attr.name}</span>
                                <span className="text-text-muted">=</span>
                                <span className="text-syntax-str">"{attr.value}"</span>
                            </span>
                        ))}
                        
                        {isSingleTextNode && (
                            <span>
                                <span className="text-syntax-tag font-bold">&gt;</span>
                                <span className="text-text-main px-1 opacity-90">{element.textContent}</span>
                                <span className="text-syntax-tag font-bold">&lt;/{tagName}&gt;</span>
                            </span>
                        )}

                        {!isSingleTextNode && (
                            <>
                                {hasChildren ? (
                                    <span className="text-syntax-tag font-bold">&gt;</span>
                                ) : (
                                    <span className="text-syntax-tag font-bold"> /&gt;</span>
                                )}

                                {hasChildren && !expanded && (
                                    <span 
                                        className="text-text-muted mx-1 cursor-pointer select-none bg-border/40 px-1.5 rounded hover:bg-brand/20 hover:text-brand" 
                                        onClick={() => setExpanded(true)}
                                    >
                                        ...
                                    </span>
                                )}

                                {hasChildren && !expanded && (
                                    <span className="text-syntax-tag font-bold">&lt;/{tagName}&gt;</span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {expanded && !isSingleTextNode && hasChildren && (
                <>
                    {Array.from(element.childNodes).map((child, i) => (
                        <XmlNode key={i} node={child} lineMap={lineMap} level={level + 1} />
                    ))}
                </>
            )}

            {expanded && !isSingleTextNode && hasChildren && (
                <div className="flex group hover:bg-surface-hover transition-colors">
                    <Gutter num={lineInfo.end} />
                    <div style={indentStyle} className="flex-1 flex font-mono text-xs leading-6 px-2">
                         <span className="w-4.5 inline-block shrink-0"></span>
                         <span className="text-syntax-tag font-bold">&lt;/{tagName}&gt;</span>
                    </div>
                </div>
            )}
        </>
    );
};

const XmlViewer: React.FC<{ xmlString: string }> = ({ xmlString }) => {
    const [xmlDoc, setXmlDoc] = useState<Document | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlString, "text/xml");
            const parseError = doc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                setError(parseError[0].textContent || "XML 解析错误");
                setXmlDoc(null);
            } else {
                setXmlDoc(doc);
                setError('');
            }
        } catch (e) { setError("无法解析 XML 内容"); }
    }, [xmlString]);

    const lineMap = useMemo(() => {
        if (!xmlDoc) return new Map<Node, LineInfo>();
        return calculateLineNumbers(xmlDoc.documentElement);
    }, [xmlDoc]);

    if (error) return <div className="text-red-500 p-8 font-mono text-xs italic bg-red-50">{error}</div>;
    if (!xmlDoc) return null;

    return (
        <div className="w-full bg-surface pb-8">
             <XmlNode node={xmlDoc.documentElement} lineMap={lineMap} />
        </div>
    );
};

export default XmlViewer;