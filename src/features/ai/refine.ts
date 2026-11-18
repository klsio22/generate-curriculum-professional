import type { CVData } from '@/types/cv';
import { AIError } from './client';
import { chatJSON, type CallOptions } from './jobTailoring';
import { isRecord, str } from './parse';
import { buildRefineMessages, type RefineContext, type RefineTurn } from './prompts';
import type { AISettings } from './types';

export interface RefineResult {
  reply: string;
  cv: CVData | null;
  declaredFacts: string[];
  discardedItems: number;
}

const TEXT_FIELDS = ['jobTitle', 'objective', 'skills', 'softSkills', 'interpersonalSkills', 'languages'] as const;
const MAX_FACTS = 5;
const MAX_FACT_LENGTH = 300;

const listText = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(str).filter(Boolean).join('\n') : value;

const patchItems = <T extends { id: string }>(
  originals: T[],
  raw: unknown,
  field: keyof T & string,
): { items: T[]; discarded: number } => {
  const candidates = Array.isArray(raw) ? raw.filter(isRecord) : [];
  const ids = new Set(originals.map((item) => item.id));
  const items = originals.map((original) => {
    const match = candidates.find((candidate) => str(candidate.id) === original.id);
    const value = match ? str(listText(match[field])) : '';
    return value ? { ...original, [field]: value } : original;
  });
  return { items, discarded: candidates.filter((candidate) => !ids.has(str(candidate.id))).length };
};

const factsFrom = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? raw
        .map(str)
        .filter(Boolean)
        .slice(0, MAX_FACTS)
        .map((fact) => fact.slice(0, MAX_FACT_LENGTH))
    : [];

export const applyRefinePatch = (base: CVData, raw: unknown): RefineResult => {
  if (!isRecord(raw) || typeof raw.reply !== 'string') throw new AIError('invalid_json');

  const result: RefineResult = { reply: raw.reply.trim(), cv: null, declaredFacts: factsFrom(raw.declaredFacts), discardedItems: 0 };
  if (!isRecord(raw.patch)) return result;

  const patch = raw.patch;
  const cv: CVData = structuredClone(base);
  for (const field of TEXT_FIELDS) {
    if (typeof patch[field] === 'string') cv[field] = patch[field].trim();
  }
  const experience = patchItems(base.experience, patch.experience, 'description');
  const projects = patchItems(base.projects ?? [], patch.projects, 'description');
  const education = patchItems(base.education, patch.education, 'topics');
  cv.experience = experience.items;
  cv.education = education.items;
  if (base.projects) cv.projects = projects.items;

  result.discardedItems = experience.discarded + projects.discarded + education.discarded;
  result.cv = JSON.stringify(cv) === JSON.stringify(base) ? null : cv;
  return result;
};

export const refineResume = (
  settings: AISettings,
  cv: CVData,
  turns: RefineTurn[],
  context: RefineContext,
  options?: CallOptions,
): Promise<RefineResult> =>
  chatJSON(settings, buildRefineMessages(cv, turns, context), (raw) => applyRefinePatch(cv, raw), options);
