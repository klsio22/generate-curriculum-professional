import type { TFunction } from 'i18next';
import type { CVData } from '@/types/cv';
import type { Comparison } from './ResumeComparison';

export type ComparableResume = Pick<
  CVData,
  'jobTitle' | 'objective' | 'skills' | 'softSkills' | 'interpersonalSkills' | 'languages' | 'experience' | 'education' | 'projects'
>;

const lines = (...parts: (string | undefined)[]) => parts.filter((part) => part?.trim()).join('\n');

const dates = (start?: string, end?: string) => [start, end].filter((part) => part?.trim()).join(' – ');

const projectsText = (cv: ComparableResume) =>
  (cv.projects ?? []).map((project) => `${project.name}: ${project.description}`).join('\n\n');

const pairById = <T extends { id: string }>(before: T[], after: T[]) => {
  const ids = [...new Set([...before.map((item) => item.id), ...after.map((item) => item.id)])];
  return ids.map((id) => ({
    id,
    before: before.find((item) => item.id === id),
    after: after.find((item) => item.id === id),
  }));
};

export const compareResumes = (t: TFunction, before: ComparableResume, after: ComparableResume): Comparison[] => [
  { key: 'headline', label: t('ai.tailor.section_headline'), before: before.jobTitle, after: after.jobTitle },
  { key: 'summary', label: t('ai.tailor.section_summary'), before: before.objective, after: after.objective },
  { key: 'skills', label: t('ai.tailor.section_skills'), before: before.skills, after: after.skills },
  { key: 'softSkills', label: t('ai.tailor.softSkills'), before: before.softSkills ?? '', after: after.softSkills ?? '' },
  {
    key: 'interpersonal',
    label: t('ai.translate.section_interpersonal'),
    before: before.interpersonalSkills ?? '',
    after: after.interpersonalSkills ?? '',
  },
  ...pairById(before.experience, after.experience).map((pair) => ({
    key: `experience-${pair.id}`,
    label: `${t('ai.tailor.section_experience')}: ${(pair.before ?? pair.after)?.company ?? ''}`,
    before: lines(pair.before?.role, dates(pair.before?.startDate, pair.before?.endDate), pair.before?.description),
    after: lines(pair.after?.role, dates(pair.after?.startDate, pair.after?.endDate), pair.after?.description),
  })),
  ...pairById(before.education, after.education).map((pair) => ({
    key: `education-${pair.id}`,
    label: `${t('ai.tailor.section_education')}: ${(pair.before ?? pair.after)?.institution ?? ''}`,
    before: lines(pair.before?.course, dates(pair.before?.startDate, pair.before?.endDate), pair.before?.topics),
    after: lines(pair.after?.course, dates(pair.after?.startDate, pair.after?.endDate), pair.after?.topics),
  })),
  { key: 'projects', label: t('ai.tailor.section_projects'), before: projectsText(before), after: projectsText(after) },
  { key: 'languages', label: t('ai.translate.section_languages'), before: before.languages ?? '', after: after.languages ?? '' },
];
