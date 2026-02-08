import React, { useState } from 'react';
import { AgentPlan, ReviewStep, StepStatus } from '../types';
import { CheckCircle, Circle, Loader2, PlayCircle, Lock, ArrowRight, AlertCircle, Target, RefreshCw, Plus, Trash2, X, Check, UserCheck, Zap } from 'lucide-react';

interface PlanOverviewProps {
  plan: AgentPlan | null;
  onStartStep: (stepId: string) => void;
  onNewIteration: () => void;
  onAddStep: (name: string, description: string) => void;
  onDeleteStep: (stepId: string) => void;
  onAutoRun: () => void;
  isProcessing: boolean;
  isAutoRunning: boolean;
  activeStepId: string | null;
}

export const PlanOverview: React.FC<PlanOverviewProps> = ({ 
  plan, 
  onStartStep, 
  onNewIteration, 
  onAddStep,
  onDeleteStep,
  onAutoRun,
  isProcessing,
  isAutoRunning,
  activeStepId 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  if (!plan) return null;

  const handleAddSubmit = () => {
    if (newName.trim() && newDesc.trim()) {
      onAddStep(newName, newDesc);
      setNewName('');
      setNewDesc('');
      setIsAdding(false);
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case StepStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-success" />;
      case StepStatus.IN_PROGRESS:
        return <Loader2 className="w-5 h-5 text-accent animate-spin" />;
      case StepStatus.PENDING:
        return <Circle className="w-5 h-5 text-slate-300" />;
      case StepStatus.FAILED:
        return <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold text-xs">!</div>;
      default:
        return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  const completedSteps = plan.steps.filter(s => s.status === StepStatus.COMPLETED).length;
  const totalSteps = plan.steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const hasPendingSteps = plan.steps.some(s => s.status === StepStatus.PENDING);

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 w-96 shrink-0 overflow-hidden">
      {/* Header Analysis Section */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 max-h-[40%] overflow-y-auto custom-scrollbar">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">文档诊断报告</h3>
        
        <div className="space-y-4">
          {/* Basic Info & Persona */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
               <span className="text-xs text-slate-500">领域</span>
               <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                {plan.analysis.category}
               </span>
            </div>
            
            {/* Dynamic Persona Display */}
            {plan.analysis.assignedPersona && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-2 flex items-start gap-2">
                 <UserCheck className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                 <div>
                   <span className="text-[10px] text-purple-500 font-bold uppercase block">已激活专家身份</span>
                   <span className="text-xs font-bold text-purple-800">{plan.analysis.assignedPersona}</span>
                 </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-slate-200 mt-1">
              <div className="flex-1 text-center">
                <span className="text-slate-400 block mb-0.5">当前</span>
                <span className="font-medium text-slate-700">{plan.analysis.currentLevel}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-300" />
              <div className="flex-1 text-center">
                <span className="text-slate-400 block mb-0.5">目标</span>
                <span className="font-medium text-accent">{plan.analysis.targetLevel}</span>
              </div>
            </div>
          </div>

          {/* Gap Analysis - The Core Feature */}
          <div className="space-y-3">
             <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <h4 className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  行业专家标准
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {plan.analysis.gapAnalysis.professionalStandards}
                </p>
             </div>

             <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                <h4 className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  识别到的缺失 (Gap)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {plan.analysis.gapAnalysis.missingContent}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Plan Steps */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <div className="sticky top-0 bg-white z-20 pb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>执行优化计划</span>
                <span className="text-xs font-normal text-slate-500">{progress}%</span>
            </h3>
            
            {/* Auto Run Button */}
            {hasPendingSteps && (
                <button
                    onClick={onAutoRun}
                    disabled={isProcessing}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                        isAutoRunning 
                        ? 'bg-blue-100 text-blue-700 cursor-wait' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg'
                    }`}
                >
                    {isAutoRunning ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Agent 自动执行中...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4 fill-current" />
                            一键自动执行 Agent 优化
                        </>
                    )}
                </button>
            )}
        </div>

        <div className="space-y-4 relative pb-4">
          {/* Vertical line connector */}
          <div className="absolute left-2.5 top-2 bottom-4 w-px bg-slate-200" />
          
          {plan.steps.map((step, index) => {
            const isActive = activeStepId === step.id;
            const isPending = step.status === StepStatus.PENDING;
            // Only show "run step" button if manual mode is possible (not auto running) and sequential order
            const isNext = isPending && !activeStepId && !isProcessing && (index === 0 || plan.steps[index - 1].status === StepStatus.COMPLETED);
            const canDelete = step.status === StepStatus.PENDING;

            return (
              <div 
                key={step.id} 
                className={`relative pl-8 transition-all duration-300 group ${isActive ? 'scale-105' : ''}`}
              >
                <div className="absolute left-0 top-1 bg-white z-10">
                  {getStatusIcon(step.status)}
                </div>
                
                <div className={`p-3 rounded-lg border transition-all relative ${
                  isActive 
                    ? 'bg-blue-50 border-accent shadow-md' 
                    : step.status === StepStatus.COMPLETED 
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-100 opacity-80'
                }`}>
                  <h4 className={`text-sm font-semibold mb-1 pr-6 ${
                    isActive ? 'text-blue-800' : 'text-slate-700'
                  }`}>
                    {step.name}
                  </h4>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Delete Button */}
                  {canDelete && !isProcessing && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteStep(step.id); }}
                      className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="删除任务"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  
                  {isNext && !isAutoRunning && (
                    <button
                      onClick={() => onStartStep(step.id)}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded transition-colors"
                    >
                      <PlayCircle className="w-3 h-3" />
                      单步执行
                    </button>
                  )}
                  
                  {isActive && isProcessing && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-accent font-medium animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {isAutoRunning ? 'Agent 正在自主优化...' : '正在扩展逻辑与内容...'}
                    </div>
                  )}

                  {step.status === StepStatus.COMPLETED && step.diffSummary && (
                    <div className="mt-2 text-xs bg-green-50 text-green-700 p-2 rounded border border-green-100 animate-in fade-in slide-in-from-top-1">
                      <strong>优化内容：</strong> {step.diffSummary}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Step Form */}
          {isAdding ? (
            <div className="ml-8 p-3 bg-white border border-accent/50 rounded-lg shadow-md animate-in fade-in slide-in-from-top-2">
              <input 
                className="w-full text-sm font-semibold mb-2 border-b border-slate-100 focus:outline-none focus:border-accent bg-transparent placeholder-slate-300"
                placeholder="任务名称"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
              <textarea 
                className="w-full text-xs text-slate-600 resize-none focus:outline-none mb-2 bg-transparent placeholder-slate-300"
                placeholder="任务描述..."
                rows={2}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleAddSubmit} 
                  className="p-1.5 text-accent hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  disabled={!newName.trim() || !newDesc.trim()}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !isAutoRunning && (
            <button 
              onClick={() => setIsAdding(true)}
              className="ml-8 flex items-center gap-1.5 text-xs text-slate-400 hover:text-accent hover:bg-blue-50 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-accent transition-all w-[calc(100%-2rem)] justify-center"
            >
              <Plus className="w-3 h-3" />
              添加自定义任务
            </button>
          )}
        </div>
      </div>

      {/* Iteration Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onNewIteration}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-sm transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          {isProcessing ? '分析中...' : '开启新一轮优化迭代'}
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          基于当前文档状态重新分析差距并制定新计划
        </p>
      </div>
    </div>
  );
};