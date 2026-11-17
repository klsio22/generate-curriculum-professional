import type { CVData } from '@/types/cv';
import { AIError, chatCompletion } from './client';
import { extractJSON, mergeTailoredCV, parseJobAnalysis, type TailorResult } from './parse';
import { buildAnalysisMessages, buildTailorMessages, JSON_RETRY_MESSAGE } from './prompts';
import type { AISettings, ChatMessage, JobAnalysis } from './types';

interface CallOptions {
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

/** Asks for JSON, validates it, and gives the model one more chance when the answer is unusable. */
export const chatJSON = async <T>(
  settings: AISettings,
  messages: ChatMessage[],
  parse: (raw: unknown) => T,
  options: CallOptions = {},
): Promise<T> => {
  const first = await chatCompletion(settings, messages, { ...options, json: true });
  try {
    return parse(extractJSON(first));
  } catch (error) {
    if (!(error instanceof AIError) || error.code !== 'invalid_json') throw error;
  }

  const retry = await chatCompletion(
    settings,
    [...messages, { role: 'assistant', content: first }, { role: 'user', content: JSON_RETRY_MESSAGE }],
    { ...options, json: true },
  );
  return parse(extractJSON(retry));
};

export const analyzeJob = (settings: AISettings, jobDescription: string, options?: CallOptions) =>
  chatJSON(settings, buildAnalysisMessages(jobDescription), parseJobAnalysis, options);

export const tailorResume = (
  settings: AISettings,
  baseCV: CVData,
  analysis: JobAnalysis,
  outputLanguage: string,
  options?: CallOptions,
): Promise<TailorResult> =>
  chatJSON(
    settings,
    buildTailorMessages(baseCV, analysis, outputLanguage),
    (raw) => mergeTailoredCV(baseCV, raw),
    options,
  );
