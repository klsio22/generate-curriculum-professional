import type { AISettings, ChatMessage } from './types';

export type AIErrorCode =
  | 'missing_settings'
  | 'invalid_key'
  | 'no_credits'
  | 'rate_limit'
  | 'model_not_found'
  | 'data_policy'
  | 'bad_request'
  | 'server'
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'empty_response'
  | 'invalid_json';

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
  if (settings.provider === 'openrouter') {
    headers['HTTP-Referer'] = globalThis.location?.origin ?? '';
    headers['X-Title'] = 'Curriculum Generator';
  }
  return headers;
};

const statusToCode = (status: number, detail = ''): AIErrorCode => {
  if (status === 401 || status === 403) return 'invalid_key';
  if (status === 402) return 'no_credits';
  if (status === 429) return 'rate_limit';
  if (status === 404 && /data policy|privacy/i.test(detail)) return 'data_policy';
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
      const message =
        candidate?.error?.message ?? (typeof candidate?.error === 'string' ? candidate.error : candidate?.message);
      if (typeof message === 'string') return message;
    } catch {}
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
    const detail = await readErrorDetail(response);
    throw new AIError(statusToCode(response.status, detail), { status: response.status, detail });
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
  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('');
    if (text.trim()) return text;
  }
  const inlineError = (body as { error?: { message?: string; code?: number } })?.error;
  if (inlineError) {
    throw new AIError(inlineError.code ? statusToCode(inlineError.code, inlineError.message) : 'server', {
      status: inlineError.code,
      detail: inlineError.message,
    });
  }
  throw new AIError('empty_response');
};

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
    if (options.json && error instanceof AIError && error.code === 'bad_request') {
      return chatCompletion(settings, messages, { ...options, json: false });
    }
    throw error;
  }
};

export interface ModelInfo {
  id: string;
  name?: string;
  label: string;
  vendor?: string;
  contextLength?: number;
  free: boolean;
}

interface RawModel {
  id?: unknown;
  name?: unknown;
  context_length?: unknown;
  pricing?: { prompt?: unknown; completion?: unknown };
  architecture?: { output_modalities?: unknown };
}

const isZeroPrice = (value: unknown) => value !== undefined && Number(value) === 0;

const answersOnlyWithText = (model: RawModel) => {
  const outputs = model.architecture?.output_modalities;
  return !Array.isArray(outputs) || outputs.every((output) => output === 'text');
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const splitName = (id: string, name: string | undefined) => {
  const clean = name?.replace(/\s*\(free\)\s*$/i, '').trim();
  const separator = clean?.indexOf(': ') ?? -1;
  if (clean && separator > 0) {
    return { vendor: clean.slice(0, separator), label: clean.slice(separator + 2) };
  }
  const slash = id.indexOf('/');
  return {
    vendor: slash > 0 ? capitalize(id.slice(0, slash)) : undefined,
    label: clean || (slash > 0 ? id.slice(slash + 1) : id),
  };
};

export const listModels = async (
  settings: AISettings,
  options: Pick<ChatOptions, 'signal' | 'fetchImpl' | 'timeoutMs'> = {},
): Promise<ModelInfo[]> => {
  const body = await request(settings, '/models', { method: 'GET' }, options);
  const data = (body as { data?: RawModel[] })?.data;
  if (!Array.isArray(data)) return [];
  return data
    .filter((model) => typeof model?.id === 'string' && model.id !== '' && answersOnlyWithText(model))
    .map((model): ModelInfo => {
      const id = (model.id as string).replace(/^models\//, '');
      const name = typeof model.name === 'string' && model.name.trim() ? model.name.trim() : undefined;
      return {
        id,
        name,
        ...splitName(id, name),
        contextLength:
          typeof model.context_length === 'number' && model.context_length > 0 ? model.context_length : undefined,
        free: id.endsWith(':free') || (isZeroPrice(model.pricing?.prompt) && isZeroPrice(model.pricing?.completion)),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
};

export const testConnection = async (
  settings: AISettings,
  options: Pick<ChatOptions, 'signal' | 'fetchImpl'> = {},
): Promise<void> => {
  await chatCompletion(
    settings,
    [{ role: 'user', content: 'Reply with the single word: ok' }],
    { ...options, maxTokens: 64, temperature: 0, timeoutMs: 90_000 },
  ).catch((error) => {
    if (error instanceof AIError && error.code === 'empty_response') return;
    throw error;
  });
};
