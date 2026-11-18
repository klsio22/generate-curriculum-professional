import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { compareResumes, type ComparableResume } from './compareResumes';

const t = ((key: string) => key) as unknown as TFunction;

const resume = (experience: ComparableResume['experience']): ComparableResume => ({
  jobTitle: 'Dev',
  objective: 'Resumo',
  skills: 'React',
  experience,
  education: [],
});

describe('compareResumes', () => {
  it('pairs experiences by id and keeps the ones that exist on one side only', () => {
    const before = resume([
      { id: 'e1', role: 'Dev', company: 'Alfa', startDate: '2020', endDate: '2021', description: 'Antes' },
      { id: 'e2', role: 'QA', company: 'Beta', startDate: '2018', endDate: '2019', description: 'Testes' },
    ]);
    const after = resume([
      { id: 'e2', role: 'QA', company: 'Beta', startDate: '2018', endDate: '2019', description: 'Testes' },
      { id: 'e1', role: 'Developer', company: 'Alfa', startDate: '2020', endDate: '2021', description: 'Depois' },
      { id: 'e3', role: 'Lead', company: 'Gama', startDate: '2022', endDate: '', description: 'Novo' },
    ]);

    const experience = compareResumes(t, before, after).filter((item) => item.key.startsWith('experience-'));

    expect(experience.map((item) => item.key)).toEqual(['experience-e1', 'experience-e2', 'experience-e3']);
    expect(experience[0]).toMatchObject({ before: 'Dev\n2020 – 2021\nAntes', after: 'Developer\n2020 – 2021\nDepois' });
    expect(experience[1].before).toBe(experience[1].after);
    expect(experience[2]).toMatchObject({ label: 'ai.tailor.section_experience: Gama', before: '' });
  });
});
