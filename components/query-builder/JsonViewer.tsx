import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonNodeProps {
    value: any;
}

const JsonNode: React.FC<JsonNodeProps> = ({ value }) => {
    // 自动检测主题
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const jsonString = JSON.stringify(value, null, 2);

    return (
        <div className="w-full h-full text-xs font-mono">
             <SyntaxHighlighter
                language="json"
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
                wrapLines={false} // 禁止换行
                wrapLongLines={false} // 强制横向滚动
            >
                {jsonString}
            </SyntaxHighlighter>
        </div>
    );
};

export default JsonNode;