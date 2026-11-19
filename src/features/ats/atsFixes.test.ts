import { describe, expect, it } from 'vitest';
import type { CVData } from '@/types/cv';
import { defaultCV } from '@/features/cv-editor/defaultCV';
import { aiFixIssues, autoFix, toListLines, userOnlyIssues } from './atsFixes';
import type { AtsRuleResult } from './atsRules';

const withCV = (change: (cv: CVData) => void): CVData => {
  const cv = structuredClone(defaultCV);
  change(cv);
  return cv;
};

describe('autoFix', () => {
  it('changes nothing in a resume without structural problems', () => {
    expect(autoFix(defaultCV)).toEqual({ cv: defaultCV, changes: [] });
  });

  it('writes dates in the short form of the resume language', () => {
    const cv = withCV((draft) => {
      draft.experience[0].startDate = 'Março de 2022';
      draft.experience[1].startDate = '09/2018';
      draft.experience[1].endDate = '2021-12';
      draft.education[0].startDate = 'mar 2019';
      draft.education[0].endDate = 'DEZ/2021';
      draft.projects![0].startDate = 'Primavera de 2021';
    });
    const { cv: fixed, changes } = autoFix(cv);
    expect(fixed.experience.map((item) => [item.startDate, item.endDate])).toEqual([
      ['Mar 2022', ''],
      ['Set 2018', 'Dez 2021'],
    ]);
    expect([fixed.education[0].startDate, fixed.education[0].endDate]).toEqual(['Mar 2019', 'Dez 2021']);
    expect(fixed.projects![0].startDate).toBe('Primavera de 2021');
    expect(changes.filter((change) => change.key === 'date')).toHaveLength(5);
    expect(cv.experience[0].startDate).toBe('Março de 2022');
  });

  it('uses English month names in an English resume', () => {
    const cv = withCV((draft) => {
      draft.locale = 'en';
      draft.experience[1].startDate = 'setembro 2018';
    });
    expect(autoFix(cv).cv.experience[1].startDate).toBe('Sep 2018');
  });

  it('swaps a start and an end in the wrong order', () => {
    const cv = withCV((draft) => {
      draft.experience[1].startDate = 'Dez 2021';
      draft.experience[1].endDate = 'Set 2018';
    });
    const { cv: fixed, changes } = autoFix(cv);
    expect([fixed.experience[1].startDate, fixed.experience[1].endDate]).toEqual(['Set 2018', 'Dez 2021']);
    expect(changes).toEqual([
      { key: 'order', params: { item: 'Desenvolvedora de Software', start: 'Set 2018', end: 'Dez 2021' } },
    ]);
  });

  it('puts skills one per line, without labels or repeats', () => {
    const cv = withCV((draft) => {
      draft.skills = 'Proficiente em: ReactJS, Next.js 13, TypeScript.\nreactjs; Docker\n- Testes (unitários, integração)';
      draft.softSkills = 'Comunicação, Liderança';
    });
    const { cv: fixed, changes } = autoFix(cv);
    expect(fixed.skills).toBe('ReactJS\nNext.js 13\nTypeScript\nDocker\nTestes (unitários, integração)');
    expect(fixed.softSkills).toBe('Comunicação\nLiderança');
    expect(changes).toEqual([
      { key: 'list', params: { section: 'skills', count: 5 } },
      { key: 'list', params: { section: 'softSkills', count: 2 } },
    ]);
  });

  it('keeps only the role in a headline written as a list and moves its technologies to the skills', () => {
    const cv = withCV((draft) => {
      draft.jobTitle =
        'Desenvolvedor Full Stack | Web e Mobile (React • Next.js • React Native) | Backend e Cloud (Node.js • PHP • AWS)';
      draft.skills = 'React\nTypeScript';
    });
    const { cv: fixed, changes } = autoFix(cv);
    expect(fixed.jobTitle).toBe('Desenvolvedor Full Stack');
    expect(fixed.skills).toBe('React\nTypeScript\nNext.js\nReact Native\nNode.js\nPHP\nAWS');
    expect(changes.map((change) => change.key)).toEqual(['headline', 'skillsAdded']);
    expect(changes[1].params.skills).toBe('Next.js, React Native, Node.js, PHP, AWS');
  });

  it('leaves a long headline without separators to the AI', () => {
    const cv = withCV((draft) => {
      draft.jobTitle = 'Engenheira de software sênior especializada em arquitetura de sistemas distribuídos';
    });
    expect(autoFix(cv).changes).toEqual([]);
  });

  it('clears display names that hide the link address', () => {
    const cv = withCV((draft) => {
      draft.githubName = 'meu github';
      draft.linkedinName = 'https://linkedin.com/in/catarina-dantas/';
    });
    const { cv: fixed, changes } = autoFix(cv);
    expect(fixed.githubName).toBe('');
    expect(fixed.linkedinName).toBe('https://linkedin.com/in/catarina-dantas/');
    expect(changes).toEqual([{ key: 'link', params: { link: 'GitHub', name: 'meu github' } }]);
  });

  it('never touches contact data, companies or courses', () => {
    const cv = withCV((draft) => {
      draft.phone = '';
      draft.address = '';
      draft.experience[0].company = '';
      draft.education[0].course = '';
    });
    const { cv: fixed } = autoFix(cv);
    expect([fixed.phone, fixed.address, fixed.experience[0].company, fixed.education[0].course]).toEqual(['', '', '', '']);
  });
});

describe('toListLines', () => {
  it('splits on commas, semicolons, bullets and bars, but not inside parentheses', () => {
    expect(toListLines('A, B; C • D | E (F, G)')).toEqual(['A', 'B', 'C', 'D', 'E (F, G)']);
  });

  it('keeps a label when the line is a single item', () => {
    expect(toListLines('Inglês: avançado')).toEqual(['Inglês: avançado']);
  });
});

describe('issue groups', () => {
  const results: AtsRuleResult[] = [
    { id: 'contact', ok: false, issues: [{ key: 'missingPhone' }] },
    { id: 'headline', ok: false, issues: [{ key: 'longHeadline', params: { count: 82, max: 60 } }, { key: 'headlineList' }] },
    { id: 'dates', ok: false, issues: [{ key: 'dateFormatHint' }, { key: 'dateOrder' }, { key: 'futureDate' }] },
    { id: 'links', ok: false, issues: [{ key: 'linkNickname' }] },
    { id: 'skills', ok: false, issues: [{ key: 'skillsInProfile' }] },
    { id: 'pages', ok: false, issues: [{ key: 'tooManyPages', params: { count: 3, max: 2 } }] },
  ];

  it('sends text problems to the AI', () => {
    expect(aiFixIssues(results).map((issue) => issue.key)).toEqual(['longHeadline', 'headlineList', 'skillsInProfile', 'tooManyPages']);
  });

  it('leaves data only the user has as warnings', () => {
    expect(userOnlyIssues(results).map((issue) => issue.key)).toEqual(['missingPhone', 'futureDate']);
  });
});
