
export enum StepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface ReviewStep {
  id: string;
  name: string;
  description: string;
  reasoning: string;
  status: StepStatus;
  output?: string;
  diffSummary?: string;
}

export interface GapAnalysis {
  professionalStandards: string;
  missingContent: string;
}

export interface DocumentAnalysis {
  category: string;
  assignedPersona?: string; // New field for the dynamic role
  currentLevel: string;
  targetLevel: string;
  summary: string;
  gapAnalysis: GapAnalysis;
}

export interface DocumentState {
  originalText: string;
  currentText: string;
  version: number;
}

export interface AgentPlan {
  analysis: DocumentAnalysis;
  steps: ReviewStep[];
}

export type LLMProvider = 'gemini' | 'openai';

export interface AppConfig {
  apiKey: string;
  provider: LLMProvider;
  baseUrl?: string;
  model: string;
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (推荐 - 均衡)', provider: 'gemini' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (最强推理)', provider: 'gemini' },
  { id: 'gemini-2.5-flash-latest', name: 'Gemini 2.5 Flash (极速)', provider: 'gemini' },
];

export const OPENAI_COMPATIBLE_PRESETS = [
  { id: 'gpt-4o', name: 'GPT-4o (OpenAI)' },
  { id: 'deepseek-chat', name: 'DeepSeek V3' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
  { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet (via OneAPI)' },
];