import { describe, expect, it } from 'vitest';
import { checkKeyFormat, isAIConfigured } from './providers';

describe('checkKeyFormat', () => {
  it('accepts keys in the provider format, empty keys and custom providers', () => {
    expect(checkKeyFormat('openrouter', ' sk-or-v1-abc ')).toBe('ok');
    expect(checkKeyFormat('gemini', 'AIzaSyabc')).toBe('ok');
    expect(checkKeyFormat('openrouter', '')).toBe('ok');
    expect(checkKeyFormat('custom', 'anything')).toBe('ok');
  });

  it('points to the right provider when the key belongs to another one', () => {
    expect(checkKeyFormat('openrouter', 'AIzaSyabc')).toBe('looks_like_gemini');
    expect(checkKeyFormat('gemini', 'sk-or-v1-abc')).toBe('looks_like_openrouter');
  });

  it('flags keys in an unknown format', () => {
    expect(checkKeyFormat('openrouter', 'sk-proj-abc')).toBe('unexpected');
    expect(checkKeyFormat('gemini', 'abc')).toBe('unexpected');
  });
});

describe('isAIConfigured', () => {
  const base = { baseUrl: 'http://localhost:3000/v1', apiKey: '', model: 'deepseek-v4-flash' };

  it('does not need a key for a local proxy or a custom server', () => {
    expect(isAIConfigured({ ...base, provider: 'proxy' })).toBe(true);
    expect(isAIConfigured({ ...base, provider: 'custom' })).toBe(true);
  });

  it('needs a key for cloud providers', () => {
    expect(isAIConfigured({ ...base, provider: 'openrouter' })).toBe(false);
    expect(isAIConfigured({ ...base, provider: 'openrouter', apiKey: 'sk-or-v1-x' })).toBe(true);
  });
});
