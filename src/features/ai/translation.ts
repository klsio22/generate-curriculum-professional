import type { CVData, Education, Experience, Project, ResumeLocale } from '@/types/cv';
import { AIError } from './client';
import { chatJSON, type CallOptions } from './jobTailoring';
import { isRecord, str } from './parse';
import { buildTranslateMessages } from './prompts';
import type { AISettings } from './types';

export interface TranslateResult {
  cv: CVData;
  discardedItems: number;
  untranslatedItems: number;
}

const TEXT_FIELDS = ['jobTitle', 'objective', 'skills', 'softSkills', 'interpersonalSkills', 'languages'] as const;

const digitsOf = (text = '') => text.replaceAll(/\D/g, '');

const translatedText = (original: string | undefined, value: unknown): string => {
  const text = str(value);
  if (!original?.trim()) return original ?? '';
  return text || original;
};

const translatedDate = (original: string | undefined, value: unknown): string => {
  const text = translatedText(original, value);
  return digitsOf(text) === digitsOf(original) ? text : (original ?? '');
};

const topicsText = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(str).filter(Boolean).join('\n') : value;

const translateExperience = (original: Experience, item: Record<string, unknown>): Experience => ({
  ...original,
  role: translatedText(original.role, item.role),
  startDate: translatedDate(original.startDate, item.startDate),
  endDate: translatedDate(original.endDate, item.endDate),
  description: translatedText(original.description, item.description),
});

const translateEducation = (original: Education, item: Record<string, unknown>): Education => ({
  ...original,
  course: translatedText(original.course, item.course),
  startDate: translatedDate(original.startDate, item.startDate),
  endDate: translatedDate(original.endDate, item.endDate),
  topics: translatedText(original.topics, topicsText(item.topics)),
});

const translateProject = (original: Project, item: Record<string, unknown>): Project => ({
  ...original,
  name: translatedText(original.name, item.name),
  startDate: translatedDate(original.startDate, item.startDate),
  endDate: translatedDate(original.endDate, item.endDate),
  description: translatedText(original.description, item.description),
});

interface ListResult<T> {
  items: T[];
  discarded: number;
  untranslated: number;
}

const mergeList = <T extends { id: string }>(
  originals: T[],
  raw: unknown,
  translate: (original: T, item: Record<string, unknown>) => T,
): ListResult<T> => {
  const candidates = Array.isArray(raw) ? raw.filter(isRecord) : [];
  const ids = new Set(originals.map((original) => original.id));
  let untranslated = 0;
  const items = originals.map((original) => {
    const match = candidates.find((candidate) => str(candidate.id) === original.id);
    if (match) return translate(original, match);
    untranslated += 1;
    return { ...original };
  });
  const discarded = candidates.filter((candidate) => !ids.has(str(candidate.id))).length;
  return { items, discarded, untranslated };
};

export const mergeTranslatedCV = (base: CVData, raw: unknown, locale: ResumeLocale): TranslateResult => {
  if (!isRecord(raw) || !TEXT_FIELDS.some((field) => typeof raw[field] === 'string')) {
    throw new AIError('invalid_json');
  }

  const cv: CVData = structuredClone(base);
  for (const field of TEXT_FIELDS) cv[field] = translatedText(base[field], raw[field]);

  const experience = mergeList(base.experience, raw.experience, translateExperience);
  const education = mergeList(base.education, raw.education, translateEducation);
  const projects = mergeList(base.projects ?? [], raw.projects, translateProject);
  cv.experience = experience.items;
  cv.education = education.items;
  if (base.projects) cv.projects = projects.items;
  cv.locale = locale;

  const lists = [experience, education, projects];
  return {
    cv,
    discardedItems: lists.reduce((total, list) => total + list.discarded, 0),
    untranslatedItems: lists.reduce((total, list) => total + list.untranslated, 0),
  };
};

export const translateResume = (
  settings: AISettings,
  cv: CVData,
  from: ResumeLocale,
  to: ResumeLocale,
  options?: CallOptions,
): Promise<TranslateResult> =>
  chatJSON(settings, buildTranslateMessages(cv, from, to), (raw) => mergeTranslatedCV(cv, raw, to), options);
