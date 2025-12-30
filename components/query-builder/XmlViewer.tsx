import React, { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import format from 'xml-formatter';
import { Card, CardBody, Chip } from "@nextui-org/react";

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
        <div className="w-full h-full p-4 bg-content2/50">
            <Card shadow="sm" className="h-full border border-default-200 bg-content1 overflow-hidden">
                <div className="px-4 py-2 border-b border-default-100 flex items-center justify-between bg-content1">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-danger-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-warning-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-success-400/80"></div>
                        </div>
                        <span className="text-xs text-default-400 font-mono ml-2">metadata.xml</span>
                    </div>
                    <Chip size="sm" variant="flat" color="primary" className="h-5 text-[10px]">XML</Chip>
                </div>
                <CardBody className="p-0 overflow-hidden">
                    <SyntaxHighlighter
                        language="xml"
                        style={theme === 'dark' ? oneDark : oneLight}
                        customStyle={{
                            margin: 0,
                            padding: '1.5rem',
                            height: '100%',
                            width: '100%',
                            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            fontFamily: '"JetBrains Mono", monospace'
                        }}
                        showLineNumbers={true}
                        lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#888', textAlign: 'right' }}
                        wrapLines={false}
                        wrapLongLines={false}
                    >
                        {formattedXml}
                    </SyntaxHighlighter>
                </CardBody>
            </Card>
        </div>
    );
};

export default XmlViewer;