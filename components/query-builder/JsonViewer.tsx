import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonNodeProps {
    value: any;
    theme: 'light' | 'dark';
}

const JsonNode: React.FC<JsonNodeProps> = ({ value, theme }) => {
    const jsonString = JSON.stringify(value, null, 2);

    return (
        <div className="w-full h-full text-sm font-mono">
             <SyntaxHighlighter
                language="json"
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
                {jsonString}
            </SyntaxHighlighter>
        </div>
    );
};

export default JsonNode;