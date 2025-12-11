import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  highlight?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming, highlight }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Helper to highlight text safely
  const HighlightText = ({ text }: { text: string }) => {
    if (!highlight || !text) return <>{text}</>;
    
    try {
      // Escape special regex characters
      const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
      
      return (
        <>
          {parts.map((part, i) => 
            part.toLowerCase() === highlight.toLowerCase() ? (
              <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-white rounded-sm px-0.5 mx-0.5 font-medium">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch (e) {
      return <>{text}</>;
    }
  };

  return (
    <div className={`markdown-body ${isStreaming ? 'animate-pulse-fast' : ''}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            
            return !inline ? (
              <div className="my-3 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 group">
                <div className="bg-slate-100/50 dark:bg-slate-900/50 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800/50 text-xs font-mono text-slate-500 flex justify-between items-center">
                  <span>{match?.[1] || 'code'}</span>
                  <button 
                    onClick={() => handleCopyCode(codeString)}
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400"
                    title="Copy code"
                  >
                    {copiedCode === codeString ? (
                      <><Check size={12} /> Copied</>
                    ) : (
                      <><Copy size={12} /> Copy</>
                    )}
                  </button>
                </div>
                <code className={`${className} block p-3 overflow-x-auto text-sm font-mono text-slate-800 dark:text-indigo-100`} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code className="bg-slate-100 dark:bg-slate-900/50 text-indigo-600 dark:text-indigo-200 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200 dark:border-slate-700/50" {...props}>
                {children}
              </code>
            )
          },
          ul: ({children}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1 text-slate-700 dark:text-slate-300">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1 text-slate-700 dark:text-slate-300">{children}</ol>,
          li: ({children}) => <li>{React.Children.map(children, child => typeof child === 'string' ? <HighlightText text={child} /> : child)}</li>,
          h1: ({children}) => <h1 className="text-xl font-bold mb-3 mt-4 text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">{children}</h1>,
          h2: ({children}) => <h2 className="text-lg font-bold mb-2 mt-3 text-slate-800 dark:text-slate-100">{children}</h2>,
          h3: ({children}) => <h3 className="text-base font-semibold mb-2 mt-3 text-slate-800 dark:text-slate-200">{children}</h3>,
          p: ({children}) => <p className="mb-2 last:mb-0 text-slate-700 dark:text-slate-300">{React.Children.map(children, child => typeof child === 'string' ? <HighlightText text={child} /> : child)}</p>,
          a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline">{children}</a>,
          blockquote: ({children}) => <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-1 my-2 bg-slate-50 dark:bg-slate-900/30 rounded-r italic text-slate-600 dark:text-slate-400">{children}</blockquote>,
          table: ({children}) => <div className="overflow-x-auto my-4 rounded border border-slate-200 dark:border-slate-700"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">{children}</table></div>,
          thead: ({children}) => <thead className="bg-slate-50 dark:bg-slate-900">{children}</thead>,
          tbody: ({children}) => <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/50">{children}</tbody>,
          tr: ({children}) => <tr>{children}</tr>,
          th: ({children}) => <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{children}</th>,
          td: ({children}) => <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;