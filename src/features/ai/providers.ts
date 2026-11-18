import type { AIProviderId, AIProviderPreset, AISettings } from './types';

export const AI_PROVIDERS: Record<AIProviderId, AIProviderPreset> = {
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelExample: 'google/gemini-2.5-flash',
    keyUrl: 'https://openrouter.ai/keys',
    keyPrefix: 'sk-or-v1-',
    editableBaseUrl: false,
    keyRequired: true,
    local: false,
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelExample: 'gemini-2.5-flash',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyPrefix: 'AIza',
    editableBaseUrl: false,
    keyRequired: true,
    local: false,
  },
  proxy: {
    id: 'proxy',
    label: 'Local proxy',
    // DeepsProxy default; other proxies (e.g. for Qwen) may use another port.
    baseUrl: 'http://localhost:3000/v1',
    modelExample: 'deepseek-v4-flash',
    keyUrl: '',
    keyPrefix: '',
    editableBaseUrl: true,
    keyRequired: false,
    local: true,
  },
  custom: {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    modelExample: 'llama3.1',
    keyUrl: '',
    keyPrefix: '',
    editableBaseUrl: true,
    keyRequired: false,
    local: true,
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
  // Local servers (e.g. Ollama, a local proxy) may not need a key.
  (!AI_PROVIDERS[settings.provider].keyRequired || settings.apiKey.trim() !== '');

export type KeyFormatHint = 'ok' | 'looks_like_gemini' | 'looks_like_openrouter' | 'unexpected';

const KEY_PATTERNS: Partial<Record<AIProviderId, RegExp>> = {
  openrouter: /^sk-or-/,
  gemini: /^AIza/,
};

/**
 * Checks if the key has the format the provider uses, to catch a key pasted
 * for the wrong provider or copied in part. Only a hint: it never blocks saving.
 */
export const checkKeyFormat = (provider: AIProviderId, apiKey: string): KeyFormatHint => {
  const key = apiKey.trim();
  const expected = KEY_PATTERNS[provider];
  if (!key || !expected || expected.test(key)) return 'ok';
  if (KEY_PATTERNS.gemini?.test(key)) return 'looks_like_gemini';
  if (KEY_PATTERNS.openrouter?.test(key)) return 'looks_like_openrouter';
  return 'unexpected';
};
