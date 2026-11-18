import type { CVData, Experience, Project } from '@/types/cv';
import { AIError } from './client';
import type { JobAnalysis, KeywordCategory, KeywordItem, KeywordPriority } from './types';

const MAX_KEYWORDS = 40;
const MAX_REQUIREMENTS = 15;

export const extractJSON = (text: string): unknown => {
  const withoutThinking = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const unfenced = withoutThinking.replace(/```(?:json)?/gi, '');
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AIError('invalid_json');
  try {
    return JSON.parse(unfenced.slice(start, end + 1));
  } catch {
    throw new AIError('invalid_json');
  }
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const nonEmptyStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(str).filter(Boolean) : [];

const CATEGORIES = new Set<KeywordCategory>(['hard_skill', 'tool', 'soft_skill', 'domain', 'other']);
const PRIORITIES = new Set<KeywordPriority>(['high', 'medium', 'low']);
const PRIORITY_ORDER: Record<KeywordPriority, number> = { high: 0, medium: 1, low: 2 };

export const parseJobAnalysis = (raw: unknown): JobAnalysis => {
  if (!isRecord(raw) || !Array.isArray(raw.keywords)) throw new AIError('invalid_json');

  const seen = new Set<string>();
  const keywords: KeywordItem[] = [];
  for (const item of raw.keywords) {
    const term = isRecord(item) ? str(item.term) : str(item);
    const key = term.toLocaleLowerCase();
    if (!term || seen.has(key)) continue;
    seen.add(key);
    const category = isRecord(item) && CATEGORIES.has(item.category as KeywordCategory)
      ? (item.category as KeywordCategory)
      : 'other';
    const priority = isRecord(item) && PRIORITIES.has(item.priority as KeywordPriority)
      ? (item.priority as KeywordPriority)
      : 'medium';
    keywords.push({ term, category, priority });
  }
  if (keywords.length === 0) throw new AIError('invalid_json');

  keywords.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return {
    jobTitle: str(raw.jobTitle),
    company: str(raw.company),
    seniority: str(raw.seniority),
    language: str(raw.language) || 'pt-BR',
    summary: str(raw.summary),
    requirements: nonEmptyStrings(raw.requirements).slice(0, MAX_REQUIREMENTS),
    keywords: keywords.slice(0, MAX_KEYWORDS),
  };
};

export interface TailorResult {
  cv: CVData;
  missingKeywords: string[];
  changes: string[];
  discardedItems: number;
}

const mergeExperience = (base: CVData, raw: Record<string, unknown>) => {
  const aiExperience = Array.isArray(raw.experience) ? raw.experience.filter(isRecord) : [];
  const baseExperienceIds = new Set(base.experience.map((e) => e.id));
  const discarded = aiExperience.filter((e) => !baseExperienceIds.has(str(e.id))).length;
  const experience = base.experience.map((original): Experience => {
    const rewrite = aiExperience.find((e) => str(e.id) === original.id);
    if (!rewrite) return { ...original };
    const lines = [str(rewrite.description), ...nonEmptyStrings(rewrite.achievements)].filter(Boolean);
    return { ...original, description: lines.length > 0 ? lines.join('\n') : original.description };
  });
  return { experience, discarded };
};

const mergeProjects = (base: CVData, raw: Record<string, unknown>) => {
  const baseProjects = base.projects ?? [];
  if (!Array.isArray(raw.projects) || baseProjects.length === 0) return { projects: null, discarded: 0 };
  const used = new Set<string>();
  const projects: Project[] = [];
  let discarded = 0;
  for (const item of raw.projects.filter(isRecord)) {
    const original = baseProjects.find((p) => p.id === str(item.id));
    if (!original) discarded += 1;
    else if (!used.has(original.id)) {
      used.add(original.id);
      projects.push({ ...original, description: str(item.description) || original.description });
    }
  }
  return { projects: projects.length > 0 ? projects : baseProjects.map((p) => ({ ...p })), discarded };
};

const mergeEducation = (base: CVData, raw: Record<string, unknown>) => {
  const aiEducation = Array.isArray(raw.education) ? raw.education.filter(isRecord) : [];
  return base.education.map((original) => {
    const rewrite = aiEducation.find((e) => str(e.id) === original.id);
    const originalTopics = (original.topics ?? '').split('\n').map((t) => t.trim()).filter(Boolean);
    if (!rewrite || originalTopics.length === 0) return { ...original };
    const allowed = new Map(originalTopics.map((t) => [t.toLocaleLowerCase(), t]));
    const topics = nonEmptyStrings(rewrite.topics)
      .map((t) => allowed.get(t.toLocaleLowerCase()))
      .filter((t): t is string => Boolean(t));
    return { ...original, topics: topics.length > 0 ? [...new Set(topics)].join('\n') : original.topics };
  });
};

export const mergeTailoredCV = (base: CVData, raw: unknown): TailorResult => {
  if (!isRecord(raw)) throw new AIError('invalid_json');

  const cv: CVData = structuredClone(base);
  for (const field of ['jobTitle', 'objective', 'skills', 'softSkills', 'interpersonalSkills'] as const) {
    const value = str(raw[field]);
    if (value) cv[field] = value;
  }

  const { experience, discarded: discardedExperience } = mergeExperience(base, raw);
  const { projects, discarded: discardedProjects } = mergeProjects(base, raw);
  cv.experience = experience;
  if (projects) cv.projects = projects;
  cv.education = mergeEducation(base, raw);

  return {
    cv,
    missingKeywords: nonEmptyStrings(raw.missingKeywords),
    changes: nonEmptyStrings(raw.changes),
    discardedItems: discardedExperience + discardedProjects,
  };
};
