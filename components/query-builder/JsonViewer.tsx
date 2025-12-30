import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// 引入更现代的主题
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardBody, Chip } from "@nextui-org/react";

interface JsonNodeProps {
    value: any;
    theme: 'light' | 'dark';
}

const JsonNode: React.FC<JsonNodeProps> = ({ value, theme }) => {
    const jsonString = JSON.stringify(value, null, 2);

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
                        <span className="text-xs text-default-400 font-mono ml-2">response.json</span>
                    </div>
                    <Chip size="sm" variant="flat" className="h-5 text-[10px]">JSON</Chip>
                </div>
                <CardBody className="p-0 overflow-hidden relative group">
                    <SyntaxHighlighter
                        language="json"
                        style={theme === 'dark' ? oneDark : oneLight}
                        customStyle={{
                            margin: 0,
                            padding: '1.5rem',
                            height: '100%',
                            width: '100%',
                            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff', // 强制背景色匹配卡片或深色 IDE
                            fontSize: '13px',
                            lineHeight: '1.6',
                            fontFamily: '"JetBrains Mono", monospace'
                        }}
                        showLineNumbers={true}
                        lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#888', textAlign: 'right' }}
                        wrapLines={false}
                        wrapLongLines={false}
                    >
                        {jsonString}
                    </SyntaxHighlighter>
                </CardBody>
            </Card>
        </div>
    );
};

export default JsonNode;