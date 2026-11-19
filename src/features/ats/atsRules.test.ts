import { describe, expect, it } from 'vitest';
import type { CVData } from '@/types/cv';
import { defaultCV } from '@/features/cv-editor/defaultCV';
import { analyzeResume, parseResumeDate, suggestDate, type AtsRuleId, type ReadBack } from './atsRules';

const today = new Date(2026, 10, 18);

const goodReadBack = (cv: CVData): ReadBack => ({ cv: structuredClone(cv), unmatched: [], text: cv.fullName, pages: 2 });

const issuesOf = (cv: CVData, id: AtsRuleId, readBack: ReadBack = goodReadBack(cv)) =>
  analyzeResume(cv, readBack, today)
    .find((rule) => rule.id === id)!
    .issues.map((issue) => issue.key);

const withCV = (change: (cv: CVData) => void): CVData => {
  const cv = structuredClone(defaultCV);
  change(cv);
  return cv;
};

describe('analyzeResume', () => {
  it('finds nothing to fix in the sample resume', () => {
    const results = analyzeResume(defaultCV, goodReadBack(defaultCV), today);
    expect(results).toHaveLength(13);
    expect(results.filter((rule) => !rule.ok)).toEqual([]);
  });

  it('reports lines the reader could not place and fields read back differently', () => {
    const readBack = goodReadBack(defaultCV);
    readBack.unmatched = ['texto solto'];
    readBack.cv.phone = '';
    readBack.cv.experience[0].startDate = 'Jan 2021';
    expect(issuesOf(defaultCV, 'readable', readBack)).toEqual(['unreadLines']);
    expect(issuesOf(defaultCV, 'readBack', readBack)).toEqual(['readBack_phone', 'readBack_experience']);
  });

  it('asks for complete contact data', () => {
    const cv = withCV((draft) => {
      draft.phone = '';
      draft.address = '';
      draft.email = 'ana@';
    });
    expect(issuesOf(cv, 'contact')).toEqual(['invalidEmail', 'missingPhone', 'missingCity']);
    expect(issuesOf(withCV((draft) => (draft.phone = '1234')), 'contact')).toEqual(['invalidPhone']);
    expect(issuesOf(withCV((draft) => (draft.phone = '+55 41 99876-5432')), 'contact')).toEqual([]);
  });

  it('wants one short headline, not a list', () => {
    const cv = withCV((draft) => {
      draft.jobTitle = 'Desenvolvedor Full Stack | Web e Mobile (React • Next.js • React Native) | Backend e Cloud';
    });
    expect(issuesOf(cv, 'headline')).toEqual(['longHeadline', 'headlineList']);
    expect(issuesOf(withCV((draft) => (draft.jobTitle = '')), 'headline')).toEqual(['missingHeadline']);
  });

  it('wants links printed as their address and without accents', () => {
    const cv = withCV((draft) => {
      draft.linkedin = 'https://www.linkedin.com/in/klésio-nascimento';
      draft.githubName = 'meu github';
      draft.portfolioName = 'https://catarinadantas.dev/';
    });
    expect(issuesOf(cv, 'links')).toEqual(['linkCharacters', 'linkNickname']);
  });

  it('asks for the standard sections', () => {
    const cv = withCV((draft) => {
      draft.objective = '';
      draft.education = [];
      draft.skills = '';
    });
    expect(issuesOf(cv, 'sections')).toEqual(['missingProfile', 'missingEducation', 'missingSkills']);
  });

  it('checks the format, order and time of every date', () => {
    const cv = withCV((draft) => {
      draft.experience[0].startDate = 'Março de 2026';
      draft.experience[1].startDate = 'Dez 2021';
      draft.experience[1].endDate = 'Set 2018';
      draft.projects![1].endDate = 'Dez 2027';
      draft.projects![0].startDate = '2021';
    });
    expect(issuesOf(cv, 'dates')).toEqual(['dateFormatHint', 'dateOrder', 'futureDate', 'mixedDateStyles']);
    expect(issuesOf(withCV((draft) => (draft.experience[0].endDate = 'Atual')), 'dates')).toEqual([]);
    expect(issuesOf(withCV((draft) => (draft.education[0].endDate = 'Dez 2027')), 'dates')).toEqual([]);
    const futureStart = withCV((draft) => {
      draft.education[0].startDate = 'Mar 2027';
      draft.education[0].endDate = 'Dez 2029';
    });
    expect(issuesOf(futureStart, 'dates')).toEqual(['futureDate']);
    expect(issuesOf(withCV((draft) => (draft.experience[0].startDate = '')), 'dates')).toEqual(['missingStart']);
  });

  it('asks for the title, organization and description of each entry', () => {
    const cv = withCV((draft) => {
      draft.experience[0].company = '';
      draft.experience[1].description = '';
      draft.education[0].institution = '';
    });
    expect(issuesOf(cv, 'entries')).toEqual(['experienceNoCompany', 'experienceNoDescription', 'educationNoInstitution']);
  });

  it('wants short result lines with numbers', () => {
    const cv = withCV((draft) => {
      draft.experience[0].description = `Desenvolvi telas. ${'Muito texto corrido. '.repeat(20)}`;
    });
    expect(issuesOf(cv, 'results')).toEqual(['longParagraph', 'noNumbers']);
  });

  it('wants a list of skills, not skills inside the profile', () => {
    const cv = withCV((draft) => {
      draft.skills = 'Proficiente em: ReactJS, Next.js 13, TypeScript, CSS/SASS, Styled-Components\nNode.js';
      draft.objective = 'Desenvolvedor web.\nHabilidades e Tecnologias:\nReact, Next.js, Node.js, Docker, AWS, PHP';
    });
    expect(issuesOf(cv, 'skills')).toEqual(['fewSkills', 'longSkill', 'skillsInProfile']);
  });

  it('wants one language across the resume', () => {
    const cv = withCV((draft) => {
      draft.locale = 'en';
      draft.objective = 'I am a developer with experience in the development of systems for the web and mobile.';
    });
    expect(issuesOf(cv, 'language')).toEqual(['languageMismatch', 'mixedLanguages']);
  });

  it('flags long PDFs and lost characters', () => {
    const readBack = { ...goodReadBack(defaultCV), pages: 3, text: 'Jos�' };
    expect(issuesOf(defaultCV, 'pages', readBack)).toEqual(['tooManyPages']);
    expect(issuesOf(defaultCV, 'characters', readBack)).toEqual(['lostCharacters']);
  });
});

describe('dates', () => {
  it('reads "Mmm AAAA" and "AAAA" in Portuguese and English', () => {
    expect(parseResumeDate('Mar 2026')).toEqual({ month: 2026 * 12 + 2, style: 'month' });
    expect(parseResumeDate('Aug 2020')).toEqual({ month: 2020 * 12 + 7, style: 'month' });
    expect(parseResumeDate('2020')).toEqual({ month: 2020 * 12, style: 'year' });
    expect(parseResumeDate('Março de 2026')).toBeNull();
    expect(parseResumeDate('03/2026')).toBeNull();
  });

  it('suggests the short form of a written or numeric month', () => {
    expect(suggestDate('Março de 2026')).toBe('Mar 2026');
    expect(suggestDate('setembro 2019')).toBe('Set 2019');
    expect(suggestDate('August 2020', 'en')).toBe('Aug 2020');
    expect(suggestDate('August 2020')).toBe('Ago 2020');
    expect(suggestDate('03/2026')).toBe('Mar 2026');
    expect(suggestDate('2026-03')).toBe('Mar 2026');
    expect(suggestDate('mar. 2026')).toBe('Mar 2026');
    expect(suggestDate('MAR/2026', 'en')).toBe('Mar 2026');
    expect(suggestDate('Mar 2026')).toBeNull();
    expect(suggestDate('13/2026')).toBeNull();
    expect(suggestDate('Primavera de 2026')).toBeNull();
  });
});
