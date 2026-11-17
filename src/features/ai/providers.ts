import type { AIProviderId, AIProviderPreset, AISettings } from './types';

export const AI_PROVIDERS: Record<AIProviderId, AIProviderPreset> = {
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelExample: 'google/gemini-2.5-flash',
    keyUrl: 'https://openrouter.ai/keys',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelExample: 'gemini-2.5-flash',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  custom: {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    modelExample: 'llama3.1',
    keyUrl: '',
  },
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'openrouter',
  baseUrl: AI_PROVIDERS.openrouter.baseUrl,
  apiKey: '',
  model: '',
};

export const isAIConfigured = (settings: AISettings): boolean =>
  settings.baseUrl.trim() !== '' && settings.model.trim() !== '' &&
  // Local servers (e.g. Ollama) may not need a key.
  (settings.provider === 'custom' || settings.apiKey.trim() !== '');
