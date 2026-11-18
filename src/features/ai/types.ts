export type AIProviderId = 'openrouter' | 'gemini' | 'proxy' | 'custom';

export interface AIProviderPreset {
  id: AIProviderId;
  label: string;
  baseUrl: string;
  modelExample: string;
  keyUrl: string;
  keyPrefix: string;
  editableBaseUrl: boolean;
  keyRequired: boolean;
  local: boolean;
}

export interface AISettings {
  provider: AIProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type KeywordCategory = 'hard_skill' | 'tool' | 'soft_skill' | 'domain' | 'other';
export type KeywordPriority = 'high' | 'medium' | 'low';

export interface KeywordItem {
  term: string;
  category: KeywordCategory;
  priority: KeywordPriority;
}

export interface JobAnalysis {
  jobTitle: string;
  company: string;
  seniority: string;
  language: string;
  summary: string;
  requirements: string[];
  keywords: KeywordItem[];
}
