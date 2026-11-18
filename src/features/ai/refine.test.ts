import { describe, expect, it } from 'vitest';
import type { CVData } from '@/types/cv';
import { AIError } from './client';
import { applyRefinePatch } from './refine';
import { buildRefineMessages, buildTailorMessages, MAX_REFINE_TURNS, type RefineTurn } from './prompts';
import type { JobAnalysis } from './types';

const cv: CVData = {
  fullName: 'Ana Souza',
  jobTitle: 'Desenvolvedora',
  address: 'São Paulo',
  phone: '(11) 98888-7777',
  email: 'ana@example.com',
  linkedin: 'linkedin.com/in/ana',
  objective: 'Desenvolvedora com experiência em React.',
  skills: 'React\nTypeScript',
  softSkills: 'Comunicação',
  experience: [
    { id: 'e1', role: 'Dev', company: 'Empresa Alfa', startDate: '2020', endDate: 'Atual', description: 'Criei telas.' },
  ],
  education: [{ id: 'd1', course: 'CC', institution: 'USP', startDate: '2015', endDate: '2019', topics: 'Algoritmos' }],
  projects: [{ id: 'p1', name: 'Tarefas', description: 'App de tarefas.' }],
};

describe('applyRefinePatch', () => {
  it('returns only the reply when there is no patch', () => {
    const result = applyRefinePatch(cv, { reply: 'Pode me dizer qual seção?', patch: null, declaredFacts: [] });
    expect(result).toEqual({ reply: 'Pode me dizer qual seção?', cv: null, declaredFacts: [], discardedItems: 0 });
  });

  it('changes only the fields in the patch and keeps the rest', () => {
    const { cv: next } = applyRefinePatch(cv, {
      reply: 'Resumo mais curto.',
      patch: { objective: ' Dev React. ', experience: [{ id: 'e1', description: 'Criei telas em React.' }] },
      declaredFacts: [],
    });

    expect(next?.objective).toBe('Dev React.');
    expect(next?.experience[0]).toEqual({ ...cv.experience[0], description: 'Criei telas em React.' });
    expect(next?.skills).toBe(cv.skills);
    expect(next?.email).toBe(cv.email);
    expect(next?.experience[0].company).toBe('Empresa Alfa');
  });

  it('cannot add or rename entries, and counts unknown ids', () => {
    const { cv: next, discardedItems } = applyRefinePatch(cv, {
      reply: 'ok',
      patch: {
        experience: [{ id: 'new', description: 'CTO na Beta' }, { id: 'e1', role: 'CTO', description: 'Criei telas.' }],
        education: [{ id: 'd1', topics: ['Algoritmos', 'GraphQL'] }],
      },
    });

    expect(next?.experience).toHaveLength(1);
    expect(next?.experience[0].role).toBe('Dev');
    expect(next?.education[0].topics).toBe('Algoritmos\nGraphQL');
    expect(discardedItems).toBe(1);
  });

  it('keeps up to five short declared facts', () => {
    const { declaredFacts } = applyRefinePatch(cv, {
      reply: 'Anotado.',
      patch: null,
      declaredFacts: [' Fiz um curso de GraphQL em 2026 ', '', 'a', 'b', 'c', 'd', 'e', 'x'.repeat(400)],
    });

    expect(declaredFacts).toEqual(['Fiz um curso de GraphQL em 2026', 'a', 'b', 'c', 'd']);
  });

  it('treats a patch that changes nothing as no proposal', () => {
    expect(applyRefinePatch(cv, { reply: 'ok', patch: { objective: cv.objective } }).cv).toBeNull();
  });

  it('never changes the resume it received', () => {
    const copy = structuredClone(cv);
    applyRefinePatch(cv, { reply: 'ok', patch: { objective: 'Outro' } });
    expect(cv).toEqual(copy);
  });

  it('asks again when the answer has no reply', () => {
    expect(() => applyRefinePatch(cv, { patch: null })).toThrow(AIError);
    expect(() => applyRefinePatch(cv, 'texto')).toThrow(AIError);
  });
});

describe('buildRefineMessages', () => {
  const turns: RefineTurn[] = Array.from({ length: MAX_REFINE_TURNS + 4 }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `turn ${index}`,
  }));

  it('sends the resume without contact data, the facts, the job and only the latest turns', () => {
    const messages = buildRefineMessages(cv, turns, {
      uiLanguage: 'pt-BR',
      resumeLanguage: 'en',
      declaredFacts: ['GraphQL course in 2026'],
      jobText: 'We need GraphQL',
    });

    expect(messages[0].content).toContain('in Brazilian Portuguese');
    expect(messages[0].content).toContain('in English');
    for (const secret of [cv.email, cv.phone, cv.address, cv.linkedin, cv.fullName]) {
      expect(messages[1].content).not.toContain(secret);
    }
    expect(messages[1].content).toContain('GraphQL course in 2026');
    expect(messages[1].content).toContain('<job_posting>');
    expect(messages.slice(3)).toEqual(turns.slice(-MAX_REFINE_TURNS));
  });
});

describe('buildTailorMessages', () => {
  const analysis: JobAnalysis = {
    jobTitle: 'Dev',
    company: '',
    seniority: '',
    language: 'pt-BR',
    summary: '',
    requirements: [],
    keywords: [{ term: 'GraphQL', category: 'tool', priority: 'high' }],
  };

  it('lets tailoring use the facts the candidate declared', () => {
    const withFacts = buildTailorMessages({ ...cv, meta: { declaredFacts: ['Curso de GraphQL em 2026'] } }, analysis, 'pt-BR');
    const without = buildTailorMessages(cv, analysis, 'pt-BR');

    expect(withFacts[1].content).toContain('<candidate_facts>\n- Curso de GraphQL em 2026');
    expect(without[1].content).not.toContain('<candidate_facts>');
  });
});
