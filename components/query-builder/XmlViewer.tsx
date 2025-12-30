import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'xml-formatter'; // 如果需要格式化，这里假设后端返回已经是格式化的，或者简单展示

// 简单的 XML 格式化函数 (如果环境没有 xml-formatter 库)
function formatXml(xml: string) {
    let formatted = '';
    let reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    xml.split('\r\n').forEach((node) => {
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }
        let padding = '';
        for (let i = 0; i < pad; i++) {
            padding += '  ';
        }
        formatted += padding + node + '\r\n';
        pad += indent;
    });
    return formatted;
}

const XmlViewer: React.FC<{ xmlString: string }> = ({ xmlString }) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // 尝试简单格式化，避免单行过长
    const formattedXml = formatXml(xmlString);

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