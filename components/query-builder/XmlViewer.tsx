import React, { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import format from 'xml-formatter';

const XmlViewer: React.FC<{ xmlString: string }> = ({ xmlString }) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const formattedXml = useMemo(() => {
        try {
            return format(xmlString, {
                indentation: '  ',
                collapseContent: true,
                lineSeparator: '\n'
            });
        } catch (e) {
            // 如果格式化失败（例如 XML 不完整），回退到原始字符串
            return xmlString;
        }
    }, [xmlString]);

    return (
        <div className="w-full h-full text-xs font-mono">
             <SyntaxHighlighter
                language="xml"
                style={isDark ? vscDarkPlus : vs}
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    height: '100%',
                    width: '100%',
                    backgroundColor: 'transparent',
                    fontSize: '12px',
                    lineHeight: '1.5',
                }}
                wrapLines={false}
                wrapLongLines={false}
            >
                {formattedXml}
            </SyntaxHighlighter>
        </div>
    );
};

export default XmlViewer;