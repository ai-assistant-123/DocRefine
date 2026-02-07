import React, { useState, useEffect } from 'react';
import { Settings, Save, X, Key, Cpu, Globe, Server } from 'lucide-react';
import { AppConfig, AVAILABLE_MODELS, OPENAI_COMPATIBLE_PRESETS } from '../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, config, onSave }) => {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [provider, setProvider] = useState<AppConfig['provider']>(config.provider || 'gemini');
  const [model, setModel] = useState(config.model);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || '');

  useEffect(() => {
    if (isOpen) {
      setApiKey(config.apiKey);
      setProvider(config.provider || 'gemini');
      setModel(config.model);
      setBaseUrl(config.baseUrl || '');
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ apiKey, provider, model, baseUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            配置 AI 模型
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              模型服务商
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                   setProvider('gemini');
                   // Reset to a default gemini model if switching back
                   if (!AVAILABLE_MODELS.find(m => m.id === model)) {
                     setModel(AVAILABLE_MODELS[0].id);
                   }
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  provider === 'gemini' 
                    ? 'border-accent bg-blue-50 text-accent font-medium' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm">Google Gemini</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProvider('openai');
                  // Reset to a default openai model if switching
                  if (AVAILABLE_MODELS.find(m => m.id === model)) {
                    setModel('gpt-4o');
                  }
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  provider === 'openai' 
                    ? 'border-accent bg-blue-50 text-accent font-medium' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm">OpenAI 兼容</span>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-400" />
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'gemini' ? "Gemini API Key" : "sk-..."}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-mono"
            />
          </div>

          {/* OpenAI Specific Fields */}
          {provider === 'openai' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  Base URL (选填)
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-mono"
                />
                <p className="text-xs text-slate-500">
                  如果不填，默认为 https://api.openai.com/v1。使用 DeepSeek 等服务时请填写对应的 Endpoint。
                </p>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">模型名称 (Model ID)</label>
                 
                 {/* Presets for OpenAI */}
                 <div className="flex flex-wrap gap-2 mb-2">
                   {OPENAI_COMPATIBLE_PRESETS.map(preset => (
                     <button
                       key={preset.id}
                       onClick={() => setModel(preset.id)}
                       className={`text-xs px-2 py-1 rounded border ${model === preset.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                     >
                       {preset.name}
                     </button>
                   ))}
                 </div>

                 <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. gpt-4o, deepseek-chat"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm font-mono"
                />
              </div>
            </div>
          )}

          {/* Gemini Model Selection */}
          {provider === 'gemini' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-400" />
                选择模型 (LLM)
              </label>
              <div className="space-y-2">
                {AVAILABLE_MODELS.map((m) => (
                  <label 
                    key={m.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      model === m.id 
                        ? 'border-accent bg-blue-50/50 ring-1 ring-accent/20' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={m.id}
                      checked={model === m.id}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-4 h-4 text-accent border-slate-300 focus:ring-accent"
                    />
                    <div className="ml-3">
                      <span className={`block text-sm font-medium ${model === m.id ? 'text-blue-900' : 'text-slate-700'}`}>
                        {m.name}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        {m.id}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-blue-600 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};