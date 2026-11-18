import { describe, expect, it, vi } from 'vitest';
import type { CVData } from '@/types/cv';
import { AIError } from './client';
import { buildTranslateMessages } from './prompts';
import { mergeTranslatedCV, prepareTailorBase, titleWithoutLanguage } from './translation';
import type { AISettings } from './types';

const base: CVData = {
  fullName: 'Ana Souza',
  jobTitle: 'Desenvolvedora Front-end',
  address: 'São Paulo, SP',
  phone: '(11) 98888-7777',
  email: 'ana@example.com',
  linkedin: 'linkedin.com/in/ana',
  objective: 'Desenvolvedora com experiência em React.',
  skills: 'React\nTypeScript',
  languages: 'Inglês: avançado',
  softSkills: '',
  interpersonalSkills: '',
  experience: [
    {
      id: 'e1',
      role: 'Desenvolvedora',
      company: 'Empresa Alfa',
      startDate: 'jan 2020',
      endDate: 'Atual',
      description: 'Criei telas em React.\nRevisei código.',
    },
  ],
  education: [
    {
      id: 'd1',
      course: 'Ciência da Computação',
      institution: 'Universidade Federal',
      startDate: '2015',
      endDate: '2019',
      topics: 'Algoritmos\nBanco de dados',
    },
  ],
  projects: [{ id: 'p1', name: 'Gestor de tarefas', description: 'App de tarefas.', link: 'github.com/ana/tasks' }],
  references: [{ id: 'r1', name: 'Carlos', email: 'c@example.com', phone: '1' }],
  meta: { targetJob: 'Front-end', createdByAI: true },
};

const translated = {
  jobTitle: 'Front-end Developer',
  objective: 'Developer with experience in React.',
  skills: 'React\nTypeScript',
  softSkills: 'Should stay empty',
  interpersonalSkills: '',
  languages: 'English: advanced',
  experience: [
    {
      id: 'e1',
      role: 'Developer',
      startDate: 'Jan 2020',
      endDate: 'Present',
      description: 'Built screens in React.\nReviewed code.',
    },
  ],
  education: [{ id: 'd1', course: 'Computer Science', startDate: '2015', endDate: '2019', topics: ['Algorithms', 'Databases'] }],
  projects: [{ id: 'p1', name: 'Task manager', startDate: '', endDate: '', description: 'Task app.' }],
};

describe('mergeTranslatedCV', () => {
  it('uses the translated texts and sets the new language', () => {
    const { cv, discardedItems, untranslatedItems } = mergeTranslatedCV(base, translated, 'en');

    expect(cv.locale).toBe('en');
    expect(cv.jobTitle).toBe('Front-end Developer');
    expect(cv.languages).toBe('English: advanced');
    expect(cv.experience[0]).toMatchObject({
      role: 'Developer',
      startDate: 'Jan 2020',
      endDate: 'Present',
      description: 'Built screens in React.\nReviewed code.',
    });
    expect(cv.education[0]).toMatchObject({ course: 'Computer Science', topics: 'Algorithms\nDatabases' });
    expect(cv.projects?.[0]).toMatchObject({ name: 'Task manager', description: 'Task app.' });
    expect(discardedItems).toBe(0);
    expect(untranslatedItems).toBe(0);
  });

  it('keeps names, contact data and links from the original', () => {
    const { cv } = mergeTranslatedCV(base, { ...translated, fullName: 'Anna', email: 'x@x.com' }, 'en');

    expect(cv.fullName).toBe(base.fullName);
    expect(cv.email).toBe(base.email);
    expect(cv.experience[0].company).toBe('Empresa Alfa');
    expect(cv.education[0].institution).toBe('Universidade Federal');
    expect(cv.projects?.[0].link).toBe('github.com/ana/tasks');
    expect(cv.references).toEqual(base.references);
    expect(cv.meta).toEqual(base.meta);
  });

  it('keeps empty fields empty and the original text when the translation is missing', () => {
    const { cv } = mergeTranslatedCV(base, { ...translated, objective: '' }, 'en');

    expect(cv.softSkills).toBe('');
    expect(cv.objective).toBe(base.objective);
  });

  it('rejects a translated date whose numbers changed', () => {
    const changed = {
      ...translated,
      experience: [{ ...translated.experience[0], startDate: 'Jan 2021' }],
    };
    expect(mergeTranslatedCV(base, changed, 'en').cv.experience[0].startDate).toBe('jan 2020');
  });

  it('discards items the original does not have and counts the ones left untranslated', () => {
    const raw = {
      ...translated,
      experience: [{ id: 'fake', role: 'CTO', startDate: '', endDate: '', description: 'Invented' }],
    };
    const { cv, discardedItems, untranslatedItems } = mergeTranslatedCV(base, raw, 'en');

    expect(cv.experience).toEqual(base.experience);
    expect(discardedItems).toBe(1);
    expect(untranslatedItems).toBe(1);
  });

  it('never changes the original resume', () => {
    const copy = structuredClone(base);
    mergeTranslatedCV(base, translated, 'en');
    expect(base).toEqual(copy);
  });

  it('asks for the answer again when it is not a translated resume', () => {
    expect(() => mergeTranslatedCV(base, { foo: 'bar' }, 'en')).toThrow(AIError);
    expect(() => mergeTranslatedCV(base, [], 'en')).toThrow(AIError);
  });
});

describe('buildTranslateMessages', () => {
  it('names both languages and never sends contact data, companies or links', () => {
    const [system, user] = buildTranslateMessages(base, 'pt-BR', 'en');

    expect(system.content).toContain('from Brazilian Portuguese to English');
    for (const secret of [base.email, base.phone, base.address, base.linkedin, 'Empresa Alfa', 'Universidade Federal', 'github.com/ana']) {
      expect(user.content).not.toContain(secret);
    }
    expect(user.content).toContain('Ciência da Computação');
  });
});

describe('prepareTailorBase', () => {
  const settings: AISettings = { provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'k', model: 'm' };
  const answer = () =>
    new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(translated) } }] }), {
      headers: { 'Content-Type': 'application/json' },
    });

  it('keeps the base resume when it is already in the output language', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await prepareTailorBase(settings, base, 'pt-BR', 'en', { fetchImpl });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toEqual({ ...base, locale: 'pt-BR' });
  });

  it('translates the base resume first when the output language is different', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(answer());
    const onTranslate = vi.fn();
    const result = await prepareTailorBase(settings, base, 'en', 'pt-BR', { fetchImpl }, onTranslate);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(onTranslate).toHaveBeenCalledTimes(1);
    expect(result.locale).toBe('en');
    expect(result.experience[0].role).toBe('Developer');
    expect(result.experience[0].company).toBe('Empresa Alfa');
  });

  it('does not translate to languages the app cannot set as resume language', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await prepareTailorBase(settings, base, 'es', 'pt-BR', { fetchImpl });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.locale).toBeUndefined();
  });
});

describe('titleWithoutLanguage', () => {
  it('removes the language suffixes so a new one replaces them', () => {
    expect(titleWithoutLanguage('Klésio Nascimento (Português) (English)')).toBe('Klésio Nascimento');
    expect(titleWithoutLanguage('Currículo Tech (English)')).toBe('Currículo Tech');
    expect(titleWithoutLanguage('Resume (Portuguese)')).toBe('Resume');
  });

  it('keeps other parentheses and titles made only of a suffix', () => {
    expect(titleWithoutLanguage('Currículo (cópia)')).toBe('Currículo (cópia)');
    expect(titleWithoutLanguage('(English)')).toBe('(English)');
  });
});
