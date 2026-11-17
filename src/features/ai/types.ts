export type AIProviderId = 'openrouter' | 'gemini' | 'custom';

export interface AIProviderPreset {
  id: AIProviderId;
  label: string;
  /** OpenAI-compatible base URL (the client appends /chat/completions and /models). */
  baseUrl: string;
  /** Example model id shown as placeholder. */
  modelExample: string;
  /** Where the user can create an API key. Empty for custom providers. */
  keyUrl: string;
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
  /** Language the posting is written in, e.g. "pt-BR" or "en". */
  language: string;
  summary: string;
  requirements: string[];
  keywords: KeywordItem[];
}
