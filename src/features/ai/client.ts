import type { AISettings, ChatMessage } from './types';

export type AIErrorCode =
  | 'missing_settings'
  | 'invalid_key'
  | 'no_credits'
  | 'rate_limit'
  | 'model_not_found'
  | 'bad_request'
  | 'server'
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'empty_response'
  | 'invalid_json';

/** Error with a stable code the UI translates; `detail` holds the provider's message. */
export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(code: AIErrorCode, options: { status?: number; detail?: string } = {}) {
    super(options.detail ? `${code}: ${options.detail}` : code);
    this.name = 'AIError';
    this.code = code;
    this.status = options.status;
    this.detail = options.detail;
  }
}

export interface ChatOptions {
  signal?: AbortSignal;
  /** Ask the provider for a JSON object response. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 120_000;

const trimSlash = (url: string) => url.trim().replace(/\/+$/, '');

const buildHeaders = (settings: AISettings): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.apiKey.trim()) headers.Authorization = `Bearer ${settings.apiKey.trim()}`;
  // Only OpenRouter accepts these attribution headers in its CORS policy;
  // sending them to other providers makes the browser preflight fail.
  if (settings.provider === 'openrouter') {
    headers['HTTP-Referer'] = globalThis.location?.origin ?? '';
    headers['X-Title'] = 'Curriculum Generator';
  }
  return headers;
};

const statusToCode = (status: number): AIErrorCode => {
  if (status === 401 || status === 403) return 'invalid_key';
  if (status === 402) return 'no_credits';
  if (status === 429) return 'rate_limit';
  if (status === 404) return 'model_not_found';
  if (status >= 500) return 'server';
  return 'bad_request';
};

const readErrorDetail = async (response: Response): Promise<string | undefined> => {
  try {
    const text = await response.text();
    try {
      const body = JSON.parse(text);
      const candidate = Array.isArray(body) ? body[0] : body;
      const message = candidate?.error?.message ?? candidate?.message;
      if (typeof message === 'string') return message;
    } catch {
      // not JSON
    }
    return text.slice(0, 300) || undefined;
  } catch {
    return undefined;
  }
};

const request = async (
  settings: AISettings,
  path: string,
  init: RequestInit,
  options: ChatOptions,
): Promise<unknown> => {
  if (!settings.baseUrl.trim()) throw new AIError('missing_settings');

  const timeoutSignal = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;
  const doFetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

  let response: Response;
  try {
    response = await doFetch(`${trimSlash(settings.baseUrl)}${path}`, {
      ...init,
      headers: buildHeaders(settings),
      signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw new AIError('aborted');
    if (timeoutSignal.aborted) throw new AIError('timeout');
    throw new AIError('network', { detail: error instanceof Error ? error.message : undefined });
  }

  if (!response.ok) {
    throw new AIError(statusToCode(response.status), {
      status: response.status,
      detail: await readErrorDetail(response),
    });
  }

  try {
    return await response.json();
  } catch {
    throw new AIError('empty_response', { status: response.status });
  }
};

const extractContent = (body: unknown): string => {
  const choice = (body as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === 'string' && content.trim()) return content;
  // Some providers return content as an array of parts.
  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('');
    if (text.trim()) return text;
  }
  // OpenRouter can return HTTP 200 with an error object in the body.
  const inlineError = (body as { error?: { message?: string; code?: number } })?.error;
  if (inlineError) {
    throw new AIError(inlineError.code ? statusToCode(inlineError.code) : 'server', {
      status: inlineError.code,
      detail: inlineError.message,
    });
  }
  throw new AIError('empty_response');
};

/** Sends a chat completion request and returns the text of the first choice. */
export const chatCompletion = async (
  settings: AISettings,
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> => {
  if (!settings.model.trim()) throw new AIError('missing_settings');

  const payload: Record<string, unknown> = {
    model: settings.model.trim(),
    messages,
    temperature: options.temperature ?? 0.3,
  };
  if (options.maxTokens) payload.max_tokens = options.maxTokens;
  if (options.json) payload.response_format = { type: 'json_object' };

  try {
    const body = await request(
      settings,
      '/chat/completions',
      { method: 'POST', body: JSON.stringify(payload) },
      options,
    );
    return extractContent(body);
  } catch (error) {
    // Some models reject response_format; retry once without it (the prompt still asks for JSON).
    if (options.json && error instanceof AIError && error.code === 'bad_request') {
      return chatCompletion(settings, messages, { ...options, json: false });
    }
    throw error;
  }
};

/** Lists model ids available for the configured provider. */
export const listModels = async (
  settings: AISettings,
  options: Pick<ChatOptions, 'signal' | 'fetchImpl' | 'timeoutMs'> = {},
): Promise<string[]> => {
  const body = await request(settings, '/models', { method: 'GET' }, options);
  const data = (body as { data?: { id?: unknown }[] })?.data;
  if (!Array.isArray(data)) return [];
  return data
    .map((model) => (typeof model?.id === 'string' ? model.id.replace(/^models\//, '') : ''))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};

/** Makes a tiny real request to confirm that the key and the model work. */
export const testConnection = async (
  settings: AISettings,
  options: Pick<ChatOptions, 'signal' | 'fetchImpl'> = {},
): Promise<void> => {
  await chatCompletion(
    settings,
    [{ role: 'user', content: 'Reply with the single word: ok' }],
    { ...options, maxTokens: 64, temperature: 0, timeoutMs: 30_000 },
  ).catch((error) => {
    // Reasoning models may spend the small token budget thinking and return no text;
    // the request itself succeeded, which is what this test checks.
    if (error instanceof AIError && error.code === 'empty_response') return;
    throw error;
  });
};
