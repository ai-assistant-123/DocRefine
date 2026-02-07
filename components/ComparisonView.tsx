import React from 'react';
import { Copy, Download, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ComparisonViewProps {
  currentText: string;
  stepName?: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ currentText, stepName }) => {
  
  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
  };

  const handleDownload = () => {
    const blob = new Blob([currentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'refined_document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {stepName ? `当前阶段：${stepName}` : '文档预览'}
          </h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-slate-800 hover:bg-slate-900 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
               <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <FileText className="w-4 h-4" />
                 文档内容
               </span>
               <span className="text-xs text-slate-400">
                  {currentText.length} 字符
               </span>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
               <article className="prose prose-slate max-w-4xl mx-auto prose-headings:font-semibold prose-a:text-accent prose-pre:bg-slate-800 prose-pre:text-slate-100">
                 <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                 >
                    {currentText}
                 </ReactMarkdown>
               </article>
            </div>
        </div>
      </div>
    </div>
  );
};