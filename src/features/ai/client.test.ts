import { describe, expect, it, vi } from 'vitest';
import { AIError, chatCompletion, listModels, testConnection } from './client';
import type { AISettings } from './types';

const openrouter: AISettings = {
  provider: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1/',
  apiKey: ' sk-test ',
  model: 'google/gemini-2.5-flash',
};

const gemini: AISettings = {
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  apiKey: 'g-key',
  model: 'gemini-2.5-flash',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const okChat = (content: unknown) => jsonResponse({ choices: [{ message: { content } }] });

const mockFetch = (...responses: (Response | Error)[]) => {
  const fn = vi.fn<typeof fetch>();
  for (const response of responses) {
    if (response instanceof Error) fn.mockRejectedValueOnce(response);
    else fn.mockResolvedValueOnce(response);
  }
  return fn;
};

const expectAIError = async (promise: Promise<unknown>, code: string) => {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(AIError);
  expect((error as AIError).code).toBe(code);
  return error as AIError;
};

describe('chatCompletion', () => {
  it('posts to /chat/completions and returns the first choice text', async () => {
    const fetchImpl = mockFetch(okChat('hello'));
    const text = await chatCompletion(openrouter, [{ role: 'user', content: 'hi' }], {
      fetchImpl,
      json: true,
    });

    expect(text).toBe('hello');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-test');
    expect(headers['X-Title']).toBeDefined();
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe('google/gemini-2.5-flash');
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('does not send OpenRouter-only headers to other providers', async () => {
    const fetchImpl = mockFetch(okChat('ok'));
    await chatCompletion(gemini, [{ role: 'user', content: 'hi' }], { fetchImpl });
    const headers = fetchImpl.mock.calls[0][1]?.headers as Record<string, string>;
    expect(Object.keys(headers).sort()).toEqual(['Authorization', 'Content-Type']);
  });

  it('joins content returned as an array of parts', async () => {
    const fetchImpl = mockFetch(okChat([{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }]));
    await expect(chatCompletion(gemini, [], { fetchImpl })).resolves.toBe('ab');
  });

  it.each([
    [401, 'invalid_key'],
    [402, 'no_credits'],
    [404, 'model_not_found'],
    [429, 'rate_limit'],
    [503, 'server'],
  ])('maps HTTP %i to %s and keeps the provider message', async (status, code) => {
    const fetchImpl = mockFetch(jsonResponse({ error: { message: 'provider says no' } }, status));
    const error = await expectAIError(chatCompletion(openrouter, [], { fetchImpl }), code);
    expect(error.status).toBe(status);
    expect(error.detail).toBe('provider says no');
  });

  it('maps a fetch failure (offline or CORS) to network', async () => {
    const fetchImpl = mockFetch(new TypeError('Failed to fetch'));
    await expectAIError(chatCompletion(openrouter, [], { fetchImpl }), 'network');
  });

  it('maps a user cancel to aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new DOMException('aborted', 'AbortError'));
    await expectAIError(
      chatCompletion(openrouter, [], { fetchImpl, signal: controller.signal }),
      'aborted',
    );
  });

  it('maps an error object inside a 200 response', async () => {
    const fetchImpl = mockFetch(jsonResponse({ error: { message: 'credits', code: 402 } }));
    await expectAIError(chatCompletion(openrouter, [], { fetchImpl }), 'no_credits');
  });

  it('retries once without response_format when the model rejects it', async () => {
    const fetchImpl = mockFetch(jsonResponse({ error: { message: 'unsupported' } }, 400), okChat('{}'));
    await expect(chatCompletion(openrouter, [], { fetchImpl, json: true })).resolves.toBe('{}');
    const secondBody = JSON.parse(String(fetchImpl.mock.calls[1][1]?.body));
    expect(secondBody.response_format).toBeUndefined();
  });

  it('requires a model and a base URL', async () => {
    await expectAIError(chatCompletion({ ...openrouter, model: '' }, []), 'missing_settings');
    await expectAIError(chatCompletion({ ...openrouter, baseUrl: ' ' }, []), 'missing_settings');
  });
});

describe('listModels', () => {
  it('returns sorted ids without the Gemini "models/" prefix', async () => {
    const fetchImpl = mockFetch(
      jsonResponse({ data: [{ id: 'models/gemini-b' }, { id: 'models/gemini-a' }, { foo: 1 }] }),
    );
    await expect(listModels(gemini, { fetchImpl })).resolves.toEqual(['gemini-a', 'gemini-b']);
    expect(fetchImpl.mock.calls[0][0]).toBe(`${gemini.baseUrl}/models`);
  });
});

describe('testConnection', () => {
  it('accepts a successful request with empty text (reasoning models)', async () => {
    const fetchImpl = mockFetch(okChat(''));
    await expect(testConnection(openrouter, { fetchImpl })).resolves.toBeUndefined();
  });

  it('fails with the mapped error when the key is wrong', async () => {
    const fetchImpl = mockFetch(jsonResponse({ error: { message: 'No auth' } }, 401));
    await expectAIError(testConnection(openrouter, { fetchImpl }), 'invalid_key');
  });
});
