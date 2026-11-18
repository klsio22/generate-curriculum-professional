import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { AIError } from './client';
import { describeAIError } from './errorMessage';

const t = ((key: string, values?: Record<string, string>) =>
  values ? `${key}${JSON.stringify(values)}` : key) as unknown as TFunction;

describe('describeAIError', () => {
  it('keeps the provider text out of the message and adds the key format', () => {
    const error = new AIError('invalid_key', { status: 401, detail: 'Missing Authentication header' });
    expect(describeAIError(error, t, 'openrouter')).toEqual({
      message: 'ai.errors.invalid_key ai.errors.keyPrefixHint{"provider":"OpenRouter","prefix":"sk-or-v1-"}',
      detail: 'HTTP 401: Missing Authentication header',
    });
  });

  it('gives a practical message for a rate limit', () => {
    const error = new AIError('rate_limit', { status: 429, detail: 'Provider returned error' });
    expect(describeAIError(error, t, 'openrouter').message).toBe('ai.errors.rate_limit');
  });

  it('suggests checking that a local server is running', () => {
    expect(describeAIError(new AIError('network'), t, 'proxy').message).toBe('ai.errors.network_local');
    expect(describeAIError(new AIError('network'), t, 'openrouter').message).toBe('ai.errors.network');
  });

  it('handles unknown errors', () => {
    expect(describeAIError(new Error('x'), t)).toEqual({ message: 'ai.errors.unknown' });
  });
});
