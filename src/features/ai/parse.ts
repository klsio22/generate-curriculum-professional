import type { CVData, Experience, Project } from '@/types/cv';
import { AIError } from './client';
import type { JobAnalysis, KeywordCategory, KeywordItem, KeywordPriority } from './types';

const MAX_KEYWORDS = 40;
const MAX_REQUIREMENTS = 15;

/** Pulls the JSON object out of a model answer, tolerating ```json fences and text around it. */
export const extractJSON = (text: string): unknown => {
  const unfenced = text.replace(/```(?:json)?/gi, '');
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AIError('invalid_json');
  try {
    return JSON.parse(unfenced.slice(start, end + 1));
  } catch {
    throw new AIError('invalid_json');
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const nonEmptyStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(str).filter(Boolean) : [];

const CATEGORIES: KeywordCategory[] = ['hard_skill', 'tool', 'soft_skill', 'domain', 'other'];
const PRIORITIES: KeywordPriority[] = ['high', 'medium', 'low'];
const PRIORITY_ORDER: Record<KeywordPriority, number> = { high: 0, medium: 1, low: 2 };

/** Validates the analysis answer; throws invalid_json when it is not usable. */
export const parseJobAnalysis = (raw: unknown): JobAnalysis => {
  if (!isRecord(raw) || !Array.isArray(raw.keywords)) throw new AIError('invalid_json');

  const seen = new Set<string>();
  const keywords: KeywordItem[] = [];
  for (const item of raw.keywords) {
    const term = isRecord(item) ? str(item.term) : str(item);
    const key = term.toLocaleLowerCase();
    if (!term || seen.has(key)) continue;
    seen.add(key);
    const category = isRecord(item) && CATEGORIES.includes(item.category as KeywordCategory)
      ? (item.category as KeywordCategory)
      : 'other';
    const priority = isRecord(item) && PRIORITIES.includes(item.priority as KeywordPriority)
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
  /** Keywords the model said the resume cannot honestly support. */
  missingKeywords: string[];
  /** Short explanation of what the model changed. */
  changes: string[];
  /** Items the model returned that do not exist in the base resume (dropped). */
  discardedItems: number;
}

/**
 * Applies the model's rewrite on top of the base resume.
 *
 * Facts always come from the base resume: contact data, companies, roles,
 * institutions, dates, links, references, languages and ids. The model can only
 * rewrite text fields, reorder or drop projects, and filter education topics.
 * Anything that refers to an item the base resume does not have is discarded.
 */
export const mergeTailoredCV = (base: CVData, raw: unknown): TailorResult => {
  if (!isRecord(raw)) throw new AIError('invalid_json');

  const cv: CVData = structuredClone(base);
  let discardedItems = 0;

  for (const field of ['jobTitle', 'objective', 'skills', 'softSkills', 'interpersonalSkills'] as const) {
    const value = str(raw[field]);
    if (value) cv[field] = value;
  }

  // Experience: keep every job, in the base order; only text can change.
  const aiExperience = Array.isArray(raw.experience) ? raw.experience.filter(isRecord) : [];
  const baseExperienceIds = new Set(base.experience.map((e) => e.id));
  discardedItems += aiExperience.filter((e) => !baseExperienceIds.has(str(e.id))).length;
  cv.experience = base.experience.map((original): Experience => {
    const rewrite = aiExperience.find((e) => str(e.id) === original.id);
    if (!rewrite) return { ...original };
    const description = str(rewrite.description);
    const achievements = nonEmptyStrings(rewrite.achievements);
    return {
      ...original,
      description: description || original.description,
      achievements: achievements.length > 0 ? achievements : original.achievements,
    };
  });

  // Projects: the model may reorder by relevance and leave out unrelated ones.
  const baseProjects = base.projects ?? [];
  if (Array.isArray(raw.projects) && baseProjects.length > 0) {
    const used = new Set<string>();
    const projects: Project[] = [];
    for (const item of raw.projects.filter(isRecord)) {
      const original = baseProjects.find((p) => p.id === str(item.id));
      if (!original) {
        discardedItems += 1;
        continue;
      }
      if (used.has(original.id)) continue;
      used.add(original.id);
      projects.push({ ...original, description: str(item.description) || original.description });
    }
    // An empty or broken list would erase every project; keep the originals instead.
    cv.projects = projects.length > 0 ? projects : baseProjects.map((p) => ({ ...p }));
  }

  // Education: only the topic list can be narrowed to lines that already exist.
  const aiEducation = Array.isArray(raw.education) ? raw.education.filter(isRecord) : [];
  cv.education = base.education.map((original) => {
    const rewrite = aiEducation.find((e) => str(e.id) === original.id);
    const originalTopics = (original.topics ?? '').split('\n').map((t) => t.trim()).filter(Boolean);
    if (!rewrite || originalTopics.length === 0) return { ...original };
    const allowed = new Map(originalTopics.map((t) => [t.toLocaleLowerCase(), t]));
    const topics = nonEmptyStrings(rewrite.topics)
      .map((t) => allowed.get(t.toLocaleLowerCase()))
      .filter((t): t is string => Boolean(t));
    return { ...original, topics: topics.length > 0 ? [...new Set(topics)].join('\n') : original.topics };
  });

  return {
    cv,
    missingKeywords: nonEmptyStrings(raw.missingKeywords),
    changes: nonEmptyStrings(raw.changes),
    discardedItems,
  };
};
