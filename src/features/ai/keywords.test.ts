import { describe, expect, it } from 'vitest';
import type { CVData } from '@/types/cv';
import { computeKeywordCoverage, countTerm, findNewTerms } from './keywords';
import type { KeywordItem } from './types';

describe('countTerm', () => {
  it('ignores case and accents', () => {
    expect(countTerm('Boa COMUNICACAO e comunicação', 'Comunicação')).toBe(2);
  });

  it('matches technology names with symbols', () => {
    expect(countTerm('Experiência com C#, Node.js e CI/CD.', 'C#')).toBe(1);
    expect(countTerm('Experiência com C#, Node.js e CI/CD.', 'Node.js')).toBe(1);
    expect(countTerm('Experiência com C#, Node.js e CI/CD.', 'CI/CD')).toBe(1);
  });

  it('does not match inside longer words or names', () => {
    expect(countTerm('JavaScript e TypeScript', 'Java')).toBe(0);
    expect(countTerm('C# e C++', 'C')).toBe(0);
    expect(countTerm('React Native', 'React')).toBe(1);
    expect(countTerm('Reactivity', 'React')).toBe(0);
  });

  it('returns 0 for an empty term', () => {
    expect(countTerm('anything', '  ')).toBe(0);
  });
});

const cv = (overrides: Partial<CVData>): CVData => ({
  fullName: '', jobTitle: '', address: '', phone: '', email: '', linkedin: '',
  objective: '', skills: '', education: [], experience: [],
  ...overrides,
});

const keywords: KeywordItem[] = [
  { term: 'React', category: 'hard_skill', priority: 'high' },
  { term: 'GraphQL', category: 'hard_skill', priority: 'medium' },
];

describe('computeKeywordCoverage', () => {
  it('counts matches and lists the sections where they appear', () => {
    const result = computeKeywordCoverage(
      cv({
        objective: 'Dev React',
        skills: 'React\nTypeScript',
        experience: [{ id: '1', role: 'Dev', company: 'X', startDate: '', endDate: '', description: 'Apps em React', achievements: ['React Native'] }],
      }),
      keywords,
    );
    expect(result[0]).toEqual({ term: 'React', priority: 'high', count: 4, sections: ['summary', 'skills', 'experience'] });
    expect(result[1]).toEqual({ term: 'GraphQL', priority: 'medium', count: 0, sections: [] });
  });
});

describe('findNewTerms', () => {
  it('returns keywords present only in the tailored resume', () => {
    const before = cv({ skills: 'React' });
    const after = cv({ skills: 'React\nGraphQL' });
    expect(findNewTerms(before, after, keywords)).toEqual(['GraphQL']);
  });
});
