import { useCallback, useState } from 'react';
import { AI_PROVIDERS, DEFAULT_AI_SETTINGS, isAIConfigured } from './providers';
import type { AISettings } from './types';

const STORAGE_KEY = 'ai-settings';

const readSettings = (): AISettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    const provider = parsed.provider && parsed.provider in AI_PROVIDERS ? parsed.provider : 'openrouter';
    return {
      provider,
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : AI_PROVIDERS[provider].baseUrl,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' ? parsed.model : '',
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
};

export const useAISettings = () => {
  const [settings, setSettings] = useState<AISettings>(readSettings);

  const saveSettings = useCallback((next: AISettings) => {
    const clean: AISettings = {
      provider: next.provider,
      baseUrl: next.baseUrl.trim(),
      apiKey: next.apiKey.trim(),
      model: next.model.trim(),
    };
    setSettings(clean);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {}
  }, []);

  const forgetKey = useCallback(() => {
    setSettings((current) => {
      const next = { ...current, apiKey: '' };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { settings, saveSettings, forgetKey, isConfigured: isAIConfigured(settings) };
};
