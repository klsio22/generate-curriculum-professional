import type { CVData, ResumeLocale } from '@/types/cv';
import {
  MAX_HEADLINE_LENGTH,
  parseResumeDate,
  plainUrl,
  resumeLocaleOf,
  suggestDate,
  type AtsIssue,
  type AtsRuleResult,
} from './atsRules';

export interface AutoFixChange {
  key: 'date' | 'order' | 'list' | 'link' | 'headline' | 'skillsAdded';
  params: Record<string, string | number>;
}

export interface AutoFixResult {
  cv: CVData;
  changes: AutoFixChange[];
}

export const AI_FIXABLE = new Set([
  'longHeadline',
  'headlineList',
  'skillsInProfile',
  'longSkill',
  'fewSkills',
  'longParagraph',
  'noNumbers',
  'mixedLanguages',
  'tooManyPages',
]);

export const USER_ONLY = new Set([
  'unreadLines',
  'readBack_name',
  'readBack_email',
  'readBack_phone',
  'readBack_city',
  'readBack_experience',
  'readBack_education',
  'missingName',
  'missingEmail',
  'invalidEmail',
  'missingPhone',
  'invalidPhone',
  'missingCity',
  'missingHeadline',
  'linkCharacters',
  'missingProfile',
  'missingExperience',
  'missingEducation',
  'missingSkills',
  'dateFormat',
  'missingStart',
  'futureDate',
  'mixedDateStyles',
  'experienceNoRole',
  'experienceNoCompany',
  'experienceNoDescription',
  'educationNoCourse',
  'educationNoInstitution',
  'languageMismatch',
  'lostCharacters',
]);

const LINKS = [
  ['linkedin', 'linkedinName', 'LinkedIn'],
  ['github', 'githubName', 'GitHub'],
  ['portfolio', 'portfolioName', 'Portfolio'],
] as const;

type Dated = { startDate?: string; endDate?: string };

const fixDateFormat = <T extends Dated>(item: T, label: string, locale: ResumeLocale, changes: AutoFixChange[]): T => {
  const next = { ...item };
  for (const field of ['startDate', 'endDate'] as const) {
    const date = item[field]?.trim();
    if (!date || parseResumeDate(date)) continue;
    const suggestion = suggestDate(date, locale);
    if (!suggestion) continue;
    next[field] = suggestion;
    changes.push({ key: 'date', params: { item: label, from: date, to: suggestion } });
  }
  return next;
};

const fixOrder = <T extends Dated>(item: T, label: string, changes: AutoFixChange[]): T => {
  const start = parseResumeDate(item.startDate ?? '');
  const end = parseResumeDate(item.endDate ?? '');
  if (!start || !end || start.month <= end.month) return item;
  changes.push({ key: 'order', params: { item: label, start: item.endDate ?? '', end: item.startDate ?? '' } });
  return { ...item, startDate: item.endDate, endDate: item.startDate };
};

const fixDates = <T extends Dated>(
  items: T[],
  labelOf: (item: T) => string,
  locale: ResumeLocale,
  changes: AutoFixChange[],
): T[] =>
  items.map((item) => {
    const label = labelOf(item);
    return fixOrder(fixDateFormat(item, label, locale, changes), label, changes);
  });

const splitOutsideParentheses = (line: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of line) {
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && (char === ',' || char === ';' || char === '•' || char === '|')) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  return [...parts, current];
};

const withoutLabel = (line: string) => {
  const colon = line.indexOf(':');
  return colon > 0 && line.slice(colon + 1).includes(',') ? line.slice(colon + 1) : line;
};

const MARKER = /^[-•*·]\s*/;

export const toListLines = (text: string): string[] => {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const line of text.split('\n')) {
    for (const part of splitOutsideParentheses(withoutLabel(line.trim()))) {
      const item = part.replace(MARKER, '').trim().replace(/\.$/, '');
      const key = item.toLocaleLowerCase();
      if (!item || seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  return items;
};

const fixList = (text: string | undefined, section: string, changes: AutoFixChange[]): string | undefined => {
  if (!text?.trim()) return text;
  const items = toListLines(text);
  const next = items.join('\n');
  if (next === text) return text;
  changes.push({ key: 'list', params: { section, count: items.length } });
  return next;
};

const HEADLINE_SEPARATOR = /[|•·;]/;

const insideParentheses = (text: string): string[] => {
  const parts: string[] = [];
  let open = text.indexOf('(');
  while (open >= 0) {
    const close = text.indexOf(')', open + 1);
    if (close < 0) break;
    parts.push(text.slice(open + 1, close));
    open = text.indexOf('(', close + 1);
  }
  return parts;
};
const PREVIEW_LENGTH = 50;

const preview = (text: string) => (text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text);

const fixHeadline = (cv: CVData, changes: AutoFixChange[]): Pick<CVData, 'jobTitle' | 'skills'> => {
  const headline = cv.jobTitle.trim();
  const role = headline.split(/[|•·;(]/)[0].trim();
  if (!HEADLINE_SEPARATOR.test(headline) || !role || role.length > MAX_HEADLINE_LENGTH) {
    return { jobTitle: cv.jobTitle, skills: cv.skills };
  }
  changes.push({ key: 'headline', params: { from: preview(headline), to: role } });
  const known = new Set(toListLines(cv.skills).map((skill) => skill.toLocaleLowerCase()));
  const added = insideParentheses(headline)
    .flatMap((part) => toListLines(part))
    .filter((skill) => !known.has(skill.toLocaleLowerCase()));
  if (added.length === 0) return { jobTitle: role, skills: cv.skills };
  changes.push({ key: 'skillsAdded', params: { skills: added.join(', ') } });
  return { jobTitle: role, skills: [cv.skills.trim(), ...added].filter(Boolean).join('\n') };
};

export const autoFix = (cv: CVData): AutoFixResult => {
  const changes: AutoFixChange[] = [];
  const locale = resumeLocaleOf(cv);
  const next: CVData = {
    ...cv,
    experience: fixDates(cv.experience, (item) => item.role || item.company, locale, changes),
    education: fixDates(cv.education, (item) => item.course || item.institution, locale, changes),
    projects: cv.projects ? fixDates(cv.projects, (item) => item.name, locale, changes) : cv.projects,
  };
  const headline = fixHeadline(cv, changes);
  next.jobTitle = headline.jobTitle;
  next.skills = fixList(headline.skills, 'skills', changes) ?? '';
  next.softSkills = fixList(cv.softSkills, 'softSkills', changes);
  for (const [field, nameField, label] of LINKS) {
    const url = cv[field]?.trim();
    const name = cv[nameField]?.trim();
    if (!url || !name || plainUrl(name) === plainUrl(url)) continue;
    next[nameField] = '';
    changes.push({ key: 'link', params: { link: label, name } });
  }
  return { cv: next, changes };
};

const issuesOf = (results: AtsRuleResult[]) => results.flatMap((rule) => rule.issues);

export const aiFixIssues = (results: AtsRuleResult[]): AtsIssue[] =>
  issuesOf(results).filter((issue) => AI_FIXABLE.has(issue.key));

export const userOnlyIssues = (results: AtsRuleResult[]): AtsIssue[] =>
  issuesOf(results).filter((issue) => USER_ONLY.has(issue.key));
