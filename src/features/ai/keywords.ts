import type { CVData } from '@/types/cv';
import type { KeywordItem, KeywordPriority } from './types';

export type ResumeSection = 'headline' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'other';

export interface KeywordCoverage {
  term: string;
  priority: KeywordPriority;
  count: number;
  sections: ResumeSection[];
}

export const normalizeText = (text: string): string =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

export const countTerm = (text: string, term: string): number => {
  const needle = normalizeText(term.trim());
  if (!needle) return 0;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(needle)}(?![\\p{L}\\p{N}#+])`, 'gu');
  return [...normalizeText(text).matchAll(pattern)].length;
};

const sectionTexts = (cv: CVData): Record<ResumeSection, string> => ({
  headline: cv.jobTitle ?? '',
  summary: cv.objective ?? '',
  skills: cv.skills ?? '',
  experience: cv.experience
    .map((e) => [e.role, e.description, ...(e.achievements ?? [])].join('\n'))
    .join('\n'),
  projects: (cv.projects ?? []).map((p) => [p.name, p.description, p.technologies].join('\n')).join('\n'),
  education: cv.education.map((e) => [e.course, e.topics].join('\n')).join('\n'),
  other: [cv.softSkills, cv.interpersonalSkills, cv.languages].join('\n'),
});

export const computeKeywordCoverage = (cv: CVData, keywords: KeywordItem[]): KeywordCoverage[] => {
  const texts = Object.entries(sectionTexts(cv)) as [ResumeSection, string][];
  return keywords.map(({ term, priority }) => {
    let count = 0;
    const sections: ResumeSection[] = [];
    for (const [section, text] of texts) {
      const found = countTerm(text, term);
      if (found > 0) {
        count += found;
        sections.push(section);
      }
    }
    return { term, priority, count, sections };
  });
};

export const findNewTerms = (base: CVData, tailored: CVData, keywords: KeywordItem[]): string[] => {
  const before = computeKeywordCoverage(base, keywords);
  const after = computeKeywordCoverage(tailored, keywords);
  return after.filter((k, i) => k.count > 0 && before[i].count === 0).map((k) => k.term);
};
