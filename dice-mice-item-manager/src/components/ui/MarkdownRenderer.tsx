'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for markdown elements
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 text-gray-700 dark:text-gray-300 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 text-gray-700 dark:text-gray-300 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 dark:text-gray-300">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700 dark:text-gray-300">
              {children}
            </em>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-sm rounded font-mono text-gray-900 dark:text-gray-100">
                {children}
              </code>
            ) : (
              <code className="block p-3 bg-gray-100 dark:bg-gray-800 text-sm rounded font-mono text-gray-900 dark:text-gray-100 overflow-x-auto">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 mb-2 text-gray-600 dark:text-gray-400 italic">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-200 dark:border-gray-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Utility component for spell effect text specifically
export function SpellEffectRenderer({
  content,
  className = ''
}: MarkdownRendererProps) {
  return (
    <MarkdownRenderer
      content={content}
      className={`spell-effect ${className}`}
    />
  );
}
