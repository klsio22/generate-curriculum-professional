import { describe, expect, it, vi } from 'vitest';
import type { CVData } from '@/types/cv';
import { AIError } from './client';
import { analyzeJob, tailorResume } from './jobTailoring';
import { extractJSON, mergeTailoredCV, parseJobAnalysis } from './parse';
import { buildTailorMessages, resumeForPrompt } from './prompts';
import type { AISettings, JobAnalysis } from './types';

const base: CVData = {
  fullName: 'Ana Souza',
  jobTitle: 'Desenvolvedora Front-end',
  address: 'São Paulo',
  phone: '11 99999-0000',
  email: 'ana@example.com',
  linkedin: 'linkedin.com/in/ana',
  github: 'github.com/ana',
  objective: 'Desenvolvedora com 3 anos de experiência.',
  skills: 'React.js\nTypeScript',
  softSkills: 'Comunicação',
  education: [
    { id: 'e1', course: 'ADS', institution: 'IFSP', startDate: '2018', endDate: '2020', topics: 'Algoritmos\nBanco de Dados\nRedes' },
  ],
  experience: [
    { id: 'x1', role: 'Dev Front-end', company: 'Loja X', startDate: '2021', endDate: 'Atual', description: 'Criou telas.' },
    { id: 'x2', role: 'Estagiária', company: 'Agência Y', startDate: '2020', endDate: '2021', description: 'Manteve sites.' },
  ],
  projects: [
    { id: 'p1', name: 'Portfólio', description: 'Site pessoal.', technologies: 'React' },
    { id: 'p2', name: 'Bot', description: 'Bot de Discord.', technologies: 'Node.js' },
  ],
  references: [{ id: 'r1', name: 'João', email: 'j@x.com', phone: '1' }],
};

const analysis: JobAnalysis = {
  jobTitle: 'Front-end Developer',
  company: 'Acme',
  seniority: 'Pleno',
  language: 'en',
  summary: '',
  requirements: [],
  keywords: [{ term: 'React', category: 'hard_skill', priority: 'high' }],
};

describe('extractJSON', () => {
  it('reads JSON wrapped in markdown fences and extra text', () => {
    expect(extractJSON('Sure!\n```json\n{"a": 1}\n```\nDone')).toEqual({ a: 1 });
  });

  it('ignores a <think> block before the answer (reasoning models)', () => {
    expect(extractJSON('<think>The {schema} says...</think>\n{"a": 1}')).toEqual({ a: 1 });
  });

  it('throws invalid_json when there is no object', () => {
    expect(() => extractJSON('no json here')).toThrowError(AIError);
    expect(() => extractJSON('{broken')).toThrowError(AIError);
  });
});

describe('parseJobAnalysis', () => {
  it('normalizes, dedupes and sorts keywords by priority', () => {
    const result = parseJobAnalysis({
      jobTitle: ' Dev ',
      keywords: [
        { term: 'Git', category: 'tool', priority: 'low' },
        { term: 'React', category: 'hard_skill', priority: 'high' },
        { term: 'react', category: 'hard_skill', priority: 'high' },
        { term: 'Scrum', category: 'weird', priority: 'urgent' },
        'Docker',
        { term: '' },
      ],
    });
    expect(result.jobTitle).toBe('Dev');
    expect(result.keywords).toEqual([
      { term: 'React', category: 'hard_skill', priority: 'high' },
      { term: 'Scrum', category: 'other', priority: 'medium' },
      { term: 'Docker', category: 'other', priority: 'medium' },
      { term: 'Git', category: 'tool', priority: 'low' },
    ]);
    expect(result.language).toBe('pt-BR');
  });

  it('rejects answers without keywords', () => {
    expect(() => parseJobAnalysis({ keywords: [] })).toThrowError(AIError);
    expect(() => parseJobAnalysis(['x'])).toThrowError(AIError);
  });
});

describe('mergeTailoredCV', () => {
  it('keeps facts from the base resume even when the model changes them', () => {
    const { cv, discardedItems } = mergeTailoredCV(base, {
      fullName: 'Hacker',
      email: 'evil@x.com',
      jobTitle: 'Front-end Developer',
      objective: 'New summary with React.',
      experience: [
        { id: 'x1', role: 'CTO', company: 'Google', startDate: '2010', description: 'Built React apps.', achievements: ['Shipped 10 screens'] },
        { id: 'fake', role: 'Invented job', description: 'Never happened' },
      ],
      education: [{ id: 'e1', topics: ['Banco de Dados', 'Quantum Physics'], course: 'PhD' }],
      references: [],
    });

    expect(cv.fullName).toBe('Ana Souza');
    expect(cv.email).toBe('ana@example.com');
    expect(cv.references).toEqual(base.references);
    expect(cv.jobTitle).toBe('Front-end Developer');
    expect(cv.objective).toBe('New summary with React.');

    expect(cv.experience).toHaveLength(2);
    expect(cv.experience[0]).toMatchObject({
      id: 'x1', role: 'Dev Front-end', company: 'Loja X', startDate: '2021',
      description: 'Built React apps.\nShipped 10 screens',
    });
    expect(cv.experience[0].achievements).toBeUndefined();
    expect(cv.experience[1]).toEqual(base.experience[1]);
    expect(discardedItems).toBe(1);

    expect(cv.education[0]).toMatchObject({ course: 'ADS', topics: 'Banco de Dados' });
  });

  it('reorders and filters projects but never invents them', () => {
    const { cv, discardedItems } = mergeTailoredCV(base, {
      projects: [
        { id: 'p2', description: 'Discord bot in Node.js.', technologies: 'Rust' },
        { id: 'p9', name: 'Fake', description: 'x' },
      ],
    });
    expect(cv.projects).toEqual([{ ...base.projects![1], description: 'Discord bot in Node.js.' }]);
    expect(discardedItems).toBe(1);
  });

  it('keeps all projects when the model returns an empty list', () => {
    const { cv } = mergeTailoredCV(base, { projects: [] });
    expect(cv.projects).toEqual(base.projects);
  });

  it('keeps original text when fields are missing and does not mutate the base', () => {
    const snapshot = structuredClone(base);
    const { cv, missingKeywords, changes } = mergeTailoredCV(base, {
      objective: '   ',
      missingKeywords: ['GraphQL'],
      changes: ['Reordered skills'],
    });
    expect(cv.objective).toBe(base.objective);
    expect(missingKeywords).toEqual(['GraphQL']);
    expect(changes).toEqual(['Reordered skills']);
    expect(base).toEqual(snapshot);
  });
});

describe('prompts', () => {
  it('never sends contact data to the model', () => {
    const payload = JSON.stringify(resumeForPrompt(base));
    for (const secret of ['Ana Souza', 'ana@example.com', '99999', 'São Paulo', 'linkedin.com', 'github.com', 'João']) {
      expect(payload).not.toContain(secret);
    }
    const messages = JSON.stringify(buildTailorMessages(base, analysis, 'en'));
    expect(messages).not.toContain('ana@example.com');
    expect(messages).toContain('English');
  });
});

describe('analyzeJob / tailorResume', () => {
  const settings: AISettings = { provider: 'gemini', baseUrl: 'https://x/v1', apiKey: 'k', model: 'm' };
  const reply = (content: string) =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

  it('retries once when the first answer is not valid JSON', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply('Here is the analysis: oops'))
      .mockResolvedValueOnce(reply(JSON.stringify({ keywords: ['React'] })));
    const result = await analyzeJob(settings, 'Vaga React', { fetchImpl });
    expect(result.keywords[0].term).toBe('React');
    const retryBody = JSON.parse(String(fetchImpl.mock.calls[1][1]?.body));
    expect(retryBody.messages.at(-1).role).toBe('user');
  });

  it('fails with invalid_json after the retry', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => reply('nope'));
    const error = await analyzeJob(settings, 'Vaga', { fetchImpl }).catch((e) => e);
    expect((error as AIError).code).toBe('invalid_json');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns the merged resume', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      reply(JSON.stringify({ objective: 'Tailored', experience: [] })),
    );
    const result = await tailorResume(settings, base, analysis, 'en', { fetchImpl });
    expect(result.cv.objective).toBe('Tailored');
    expect(result.cv.fullName).toBe('Ana Souza');
  });
});
