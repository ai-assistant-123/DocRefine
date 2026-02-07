import React, { useState, ChangeEvent } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [text, setText] = useState('');

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyzeClick = () => {
    if (text.trim().length > 10) {
      onAnalyze(text);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          文档输入
        </h2>
        <div className="relative">
          <input
            type="file"
            accept=".txt,.md,.json,.js,.ts"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            上传文件
          </label>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此粘贴文档内容或上传文件..."
          className="w-full h-64 p-4 rounded-lg border border-slate-300 focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none font-mono text-sm leading-relaxed text-slate-700 bg-slate-50 transition-all"
          disabled={isAnalyzing}
        />
        {text && (
          <button
            onClick={() => setText('')}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200"
            title="清空内容"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing || text.trim().length < 10}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all transform active:scale-95 ${
            isAnalyzing || text.trim().length < 10
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-accent hover:bg-blue-600 shadow-lg shadow-blue-500/30'
          }`}
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              正在分析与规划...
            </>
          ) : (
            <>
              分析并规划评审
            </>
          )}
        </button>
      </div>
      
      <p className="mt-3 text-xs text-slate-400 text-center">
        支持纯文本、Markdown和代码文件。AI将自动检测类型。
      </p>
    </div>
  );
};