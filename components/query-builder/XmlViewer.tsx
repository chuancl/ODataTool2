import React, { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import format from 'xml-formatter';

interface XmlViewerProps {
    xmlString: string;
    theme: 'light' | 'dark';
}

const XmlViewer: React.FC<XmlViewerProps> = ({ xmlString, theme }) => {
    
    const formattedXml = useMemo(() => {
        try {
            return format(xmlString, {
                indentation: '  ',
                collapseContent: true,
                lineSeparator: '\n'
            });
        } catch (e) {
            return xmlString;
        }
    }, [xmlString]);

    return (
        <div className="w-full h-full text-sm font-mono">
             <SyntaxHighlighter
                language="xml"
                style={theme === 'dark' ? vscDarkPlus : vs}
                customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    height: '100%',
                    width: '100%',
                    backgroundColor: 'transparent',
                    fontSize: '13px',
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