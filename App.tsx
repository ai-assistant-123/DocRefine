import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Layout, Settings } from 'lucide-react';
import { InputSection } from './components/InputSection';
import { PlanOverview } from './components/PlanOverview';
import { ComparisonView } from './components/ComparisonView';
import { SettingsDialog } from './components/SettingsDialog';
import { analyzeAndPlan, executeStep } from './services/geminiService';
import { AgentPlan, DocumentState, StepStatus, ReviewStep, AppConfig, AVAILABLE_MODELS } from './types';

const DEFAULT_CONFIG: AppConfig = {
  apiKey: process.env.API_KEY || '',
  provider: 'gemini',
  model: AVAILABLE_MODELS[0].id
};

function App() {
  const [docState, setDocState] = useState<DocumentState>({
    originalText: '',
    currentText: '',
    version: 0
  });
  
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Config State
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('docurefine_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure we respect environment variable if local storage is empty for key
      if (!parsed.apiKey && process.env.API_KEY && !parsed.provider) {
        parsed.apiKey = process.env.API_KEY;
      }
      // Migration for old config
      if (!parsed.provider) {
        parsed.provider = 'gemini';
      }
      return parsed;
    }
    return DEFAULT_CONFIG;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check if we need to force show settings (no API key)
  useEffect(() => {
    if (!config.apiKey && !isSettingsOpen) {
      // Small delay to allow initial render
      const timer = setTimeout(() => setIsSettingsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [config.apiKey]);

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('docurefine_config', JSON.stringify(newConfig));
  };

  const handleAnalyze = async (text: string) => {
    if (!config.apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const generatedPlan = await analyzeAndPlan(text, config);
      setPlan(generatedPlan);
      setDocState({
        originalText: text,
        currentText: text,
        version: 1
      });
    } catch (err: any) {
      setError(err.message || '文档分析失败，请检查 API Key 或重试。');
      if (err.message?.includes('API Key')) {
        setIsSettingsOpen(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewIteration = async () => {
    if (!docState.currentText) return;
    if (!config.apiKey) {
      setIsSettingsOpen(true);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    try {
      // Re-analyze based on current text
      const generatedPlan = await analyzeAndPlan(docState.currentText, config);
      setPlan(generatedPlan);
    } catch (err: any) {
      setError(err.message || '新一轮分析失败，请重试。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStep = (name: string, description: string) => {
    if (!plan) return;
    const newStep: ReviewStep = {
      id: Date.now().toString(),
      name,
      description,
      reasoning: '用户手动添加的优化任务',
      status: StepStatus.PENDING
    };
    
    setPlan({
      ...plan,
      steps: [...plan.steps, newStep]
    });
  };

  const handleDeleteStep = (stepId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      steps: plan.steps.filter(s => s.id !== stepId)
    });
  };

  const handleStepExecution = async (stepId: string) => {
    if (!plan || isProcessing) return;
    if (!config.apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const stepIndex = plan.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    setActiveStepId(stepId);
    setIsProcessing(true);
    setError(null);

    // Update status to In Progress
    const updatedPlan = { ...plan };
    updatedPlan.steps[stepIndex].status = StepStatus.IN_PROGRESS;
    setPlan(updatedPlan);

    try {
      const result = await executeStep(
        docState.currentText, 
        updatedPlan.steps[stepIndex], 
        updatedPlan.analysis,
        config
      );

      // Update state with new text
      setDocState(prev => ({
        ...prev,
        currentText: result.revisedText,
        version: prev.version + 1
      }));

      // Update step status and info
      updatedPlan.steps[stepIndex].status = StepStatus.COMPLETED;
      updatedPlan.steps[stepIndex].output = result.revisedText;
      updatedPlan.steps[stepIndex].diffSummary = result.diffSummary;
      setPlan(updatedPlan);

    } catch (err: any) {
      setError(err.message || `步骤执行失败: ${plan.steps[stepIndex].name}`);
      updatedPlan.steps[stepIndex].status = StepStatus.FAILED;
      setPlan(updatedPlan);
    } finally {
      setIsProcessing(false);
      setActiveStepId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config}
        onSave={handleSaveConfig}
      />

      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            DocRefine AI
          </h1>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-500 border border-slate-200">
            Preview
          </span>
        </div>
        <div className="flex items-center gap-3">
           {plan && (
             <button 
               onClick={() => {
                 setPlan(null);
                 setDocState({ originalText: '', currentText: '', version: 0 });
               }}
               className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mr-2"
             >
               新建项目
             </button>
           )}
           
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${
               !config.apiKey 
                 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                 : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
             }`}
           >
             <Settings className="w-4 h-4" />
             {!config.apiKey ? '配置 API Key' : '设置'}
           </button>

           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
             <Bot className="w-5 h-5" />
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Error Banner */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 text-red-600 px-6 py-3 rounded-lg shadow-lg border border-red-100 flex items-center gap-2 animate-bounce">
             <span>⚠️</span> {error}
          </div>
        )}

        {!plan ? (
          // Empty State / Input View
          <div className="h-full overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-center p-6">
               <div className="mb-8 text-center max-w-lg">
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">智能文档评审 Agent</h2>
                  <p className="text-slate-500 leading-relaxed mb-6">
                    上传草稿，AI Agent 将自动分析、规划并执行多步评审，将您的内容提升至专家级生产标准。
                  </p>
                  {!config.apiKey && (
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-sm text-accent hover:underline"
                    >
                      请先点击此处配置 API Key 以开始使用
                    </button>
                  )}
               </div>
               <InputSection onAnalyze={handleAnalyze} isAnalyzing={isProcessing} />
            </div>
          </div>
        ) : (
          // Workspace View
          <div className="h-full flex">
            {/* Left Sidebar: Plan & Progress */}
            <PlanOverview 
              plan={plan} 
              onStartStep={handleStepExecution} 
              onNewIteration={handleNewIteration}
              onAddStep={handleAddStep}
              onDeleteStep={handleDeleteStep}
              isProcessing={isProcessing}
              activeStepId={activeStepId}
            />

            {/* Right Content: Editor/Diff */}
            <ComparisonView 
              currentText={docState.currentText}
              stepName={activeStepId ? plan.steps.find(s => s.id === activeStepId)?.name : '当前状态'}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;