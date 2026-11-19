import type { CVData, ResumeLocale } from '@/types/cv';
import type { PdfContent } from '@/features/pdf-import/extractPdf';
import { parseResume } from '@/features/pdf-import/parseResume';
import { parseDescription } from '@/features/pdf/textUtils';
import { guessResumeLocale, guessTextLocale } from '@/shared/locale';

export interface ReadBack {
  cv: CVData;
  unmatched: string[];
  text: string;
  pages: number;
}

export type AtsRuleId =
  | 'readable'
  | 'readBack'
  | 'contact'
  | 'headline'
  | 'links'
  | 'sections'
  | 'dates'
  | 'entries'
  | 'results'
  | 'skills'
  | 'language'
  | 'pages'
  | 'characters';

export interface AtsIssue {
  key: string;
  params?: Record<string, string | number>;
}

export interface AtsRuleResult {
  id: AtsRuleId;
  ok: boolean;
  issues: AtsIssue[];
}

export const MAX_PAGES = 2;
export const MAX_HEADLINE_LENGTH = 60;
export const MIN_SKILLS = 5;
export const MAX_SKILL_LENGTH = 40;
export const MAX_LINE_LENGTH = 350;
const MAX_ISSUES_PER_RULE = 5;

const MONTHS = new Map<string, number>(
  Object.entries({
    jan: 0, fev: 1, feb: 1, mar: 2, abr: 3, apr: 3, mai: 4, may: 4, jun: 5, jul: 6,
    ago: 7, aug: 7, set: 8, sep: 8, out: 9, oct: 9, nov: 10, dez: 11, dec: 11,
  }),
);

const FULL_MONTHS = new Map<string, number>(
  Object.entries({
    janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5, julho: 6,
    agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5, july: 6,
    august: 7, september: 8, october: 9, november: 10, december: 11,
  }),
);

const SHORT_MONTHS: Record<ResumeLocale, string[]> = {
  'pt-BR': ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const PRESENT_WORDS = new Set(['atual', 'atualmente', 'presente', 'o momento', 'hoje', 'current', 'present', 'now', 'today']);

const HEADLINE_SEPARATORS = ['|', '•', '·', ';'];

const plain = (text: string) => text.normalize('NFD').replaceAll(/\p{M}/gu, '').toLowerCase();

export const plainUrl = (url?: string) =>
  (url ?? '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');

const lines = (text?: string) =>
  (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const result = (id: AtsRuleId, issues: AtsIssue[]): AtsRuleResult => ({
  id,
  ok: issues.length === 0,
  issues: issues.slice(0, MAX_ISSUES_PER_RULE),
});

type Period = { label: string; start?: string; end?: string; needsStart: boolean; endMayBeFuture: boolean };

const periodsOf = (cv: CVData): Period[] => [
  ...cv.experience.map((item, index) => ({
    label: item.role || item.company || `#${index + 1}`,
    start: item.startDate,
    end: item.endDate,
    needsStart: true,
    endMayBeFuture: false,
  })),
  ...cv.education.map((item, index) => ({
    label: item.course || item.institution || `#${index + 1}`,
    start: item.startDate,
    end: item.endDate,
    needsStart: false,
    endMayBeFuture: true,
  })),
  ...(cv.projects ?? []).map((item, index) => ({
    label: item.name || `#${index + 1}`,
    start: item.startDate,
    end: item.endDate,
    needsStart: false,
    endMayBeFuture: false,
  })),
];

type ParsedDate = { month: number; style: 'month' | 'year' };

export const parseResumeDate = (date: string): ParsedDate | null => {
  const parts = date.trim().split(/\s+/);
  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) return { month: Number(parts[0]) * 12, style: 'year' };
  if (parts.length !== 2 || !/^\d{4}$/.test(parts[1])) return null;
  const [name, year] = parts;
  const month = MONTHS.get(plain(name));
  if (month === undefined || name.length !== 3 || name[0] !== name[0].toUpperCase()) return null;
  return { month: Number(year) * 12 + month, style: 'month' };
};

const NUMERIC_MONTH_YEAR = /^(\d{1,2})[/.-](\d{4})$/;
const NUMERIC_YEAR_MONTH = /^(\d{4})[/.-](\d{1,2})$/;
const WORD_MONTH_YEAR = /^(\p{L}+)\.?(?:\s*[/-]\s*|\s+de\s+|\s+)(\d{4})$/iu;

const monthIndexOf = (date: string): { month: number; year: string } | null => {
  const numeric = NUMERIC_MONTH_YEAR.exec(date);
  if (numeric) return { month: Number(numeric[1]) - 1, year: numeric[2] };
  const reversed = NUMERIC_YEAR_MONTH.exec(date);
  if (reversed) return { month: Number(reversed[2]) - 1, year: reversed[1] };
  const words = WORD_MONTH_YEAR.exec(date);
  if (!words) return null;
  const word = plain(words[1]);
  const month = FULL_MONTHS.get(word) ?? (word.length === 3 ? MONTHS.get(word) : undefined);
  return month === undefined ? null : { month, year: words[2] };
};

export const suggestDate = (date: string, locale: ResumeLocale = 'pt-BR'): string | null => {
  const text = date.trim();
  const parsed = monthIndexOf(text);
  if (!parsed || parsed.month < 0 || parsed.month > 11) return null;
  const suggestion = `${SHORT_MONTHS[locale][parsed.month]} ${parsed.year}`;
  return suggestion === text ? null : suggestion;
};

const checkReadable = (readBack: ReadBack) =>
  result(
    'readable',
    readBack.unmatched.length > 0
      ? [{ key: 'unreadLines', params: { count: readBack.unmatched.length, sample: readBack.unmatched[0] } }]
      : [],
  );

const same = (a?: string, b?: string) => plain((a ?? '').trim()) === plain((b ?? '').trim());

const checkReadBack = (cv: CVData, readBack: ReadBack) => {
  const issues: AtsIssue[] = [];
  const read = readBack.cv;
  const fields = [
    ['fullName', 'name'],
    ['email', 'email'],
    ['phone', 'phone'],
    ['address', 'city'],
  ] as const;
  for (const [field, label] of fields) {
    if (cv[field].trim() && !same(cv[field], read[field])) issues.push({ key: `readBack_${label}`, params: { value: read[field] } });
  }
  cv.experience.forEach((item, index) => {
    const other = read.experience[index];
    const matches =
      other &&
      same(item.role, other.role) &&
      same(item.company, other.company) &&
      same(item.startDate, other.startDate) &&
      same(item.endDate, other.endDate);
    if (!matches) issues.push({ key: 'readBack_experience', params: { item: item.role || item.company || `#${index + 1}` } });
  });
  if (read.education.length !== cv.education.length) {
    issues.push({ key: 'readBack_education', params: { count: read.education.length, total: cv.education.length } });
  }
  return result('readBack', issues);
};

const PHONE_DIGITS = { min: 10, max: 15 };

const checkContact = (cv: CVData) => {
  const issues: AtsIssue[] = [];
  const digits = cv.phone.replaceAll(/\D/g, '');
  if (!cv.fullName.trim()) issues.push({ key: 'missingName' });
  if (!cv.email.trim()) issues.push({ key: 'missingEmail' });
  else if (!/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(cv.email.trim())) issues.push({ key: 'invalidEmail' });
  if (!cv.phone.trim()) issues.push({ key: 'missingPhone' });
  else if (digits.length < PHONE_DIGITS.min || digits.length > PHONE_DIGITS.max) issues.push({ key: 'invalidPhone' });
  if (!cv.address.trim()) issues.push({ key: 'missingCity' });
  return result('contact', issues);
};

const checkHeadline = (cv: CVData) => {
  const headline = cv.jobTitle.trim();
  const issues: AtsIssue[] = [];
  if (!headline) issues.push({ key: 'missingHeadline' });
  else {
    if (headline.length > MAX_HEADLINE_LENGTH) {
      issues.push({ key: 'longHeadline', params: { count: headline.length, max: MAX_HEADLINE_LENGTH } });
    }
    if (HEADLINE_SEPARATORS.some((separator) => headline.includes(separator))) issues.push({ key: 'headlineList' });
  }
  return result('headline', issues);
};

const LINK_FIELDS = [
  ['linkedin', 'linkedinName', 'LinkedIn'],
  ['github', 'githubName', 'GitHub'],
  ['portfolio', 'portfolioName', 'Portfolio'],
] as const;

const checkLinks = (cv: CVData) => {
  const issues: AtsIssue[] = [];
  for (const [field, nameField, label] of LINK_FIELDS) {
    const url = cv[field]?.trim();
    if (!url) continue;
    const name = cv[nameField]?.trim();
    if (name && plainUrl(name) !== plainUrl(url)) issues.push({ key: 'linkNickname', params: { link: label, name } });
    if (/[^\x21-\x7e]/.test(url)) issues.push({ key: 'linkCharacters', params: { link: label } });
  }
  return result('links', issues);
};

const checkSections = (cv: CVData) => {
  const issues: AtsIssue[] = [];
  if (!cv.objective.trim()) issues.push({ key: 'missingProfile' });
  if (cv.experience.length === 0 && (cv.projects ?? []).length === 0) issues.push({ key: 'missingExperience' });
  if (cv.education.length === 0) issues.push({ key: 'missingEducation' });
  if (!cv.skills.trim()) issues.push({ key: 'missingSkills' });
  return result('sections', issues);
};

export const resumeLocaleOf = (cv: CVData): ResumeLocale => cv.locale ?? guessResumeLocale(cv) ?? 'pt-BR';

const dateIssue = (label: string, date: string, locale: ResumeLocale): AtsIssue => {
  const suggestion = suggestDate(date, locale);
  return suggestion
    ? { key: 'dateFormatHint', params: { item: label, date, suggestion } }
    : { key: 'dateFormat', params: { item: label, date } };
};

const checkPeriod = (period: Period, thisMonth: number, styles: Set<string>, locale: ResumeLocale): AtsIssue[] => {
  const issues: AtsIssue[] = [];
  const start = period.start?.trim();
  const rawEnd = period.end?.trim();
  const end = rawEnd && PRESENT_WORDS.has(plain(rawEnd)) ? '' : rawEnd;
  if (!start && period.needsStart) issues.push({ key: 'missingStart', params: { item: period.label } });
  const parsed = [start, end].map((date) => {
    if (!date) return null;
    const value = parseResumeDate(date);
    if (!value) issues.push(dateIssue(period.label, date, locale));
    else styles.add(value.style);
    return value;
  });
  const [from, to] = parsed;
  if (from && to && from.month > to.month) issues.push({ key: 'dateOrder', params: { item: period.label } });
  const futureStart = from !== null && from.month > thisMonth;
  const futureEnd = to !== null && to.month > thisMonth && !period.endMayBeFuture;
  if (futureStart || futureEnd) issues.push({ key: 'futureDate', params: { item: period.label } });
  return issues;
};

const checkDates = (cv: CVData, today: Date) => {
  const thisMonth = today.getFullYear() * 12 + today.getMonth();
  const styles = new Set<string>();
  const locale = resumeLocaleOf(cv);
  const issues = periodsOf(cv).flatMap((period) => checkPeriod(period, thisMonth, styles, locale));
  if (styles.size > 1) issues.push({ key: 'mixedDateStyles' });
  return result('dates', issues);
};

const checkEntries = (cv: CVData) => {
  const issues: AtsIssue[] = [];
  cv.experience.forEach((item, index) => {
    const label = item.role || item.company || `#${index + 1}`;
    if (!item.role.trim()) issues.push({ key: 'experienceNoRole', params: { item: label } });
    if (!item.company.trim()) issues.push({ key: 'experienceNoCompany', params: { item: label } });
    if (!item.description.trim()) issues.push({ key: 'experienceNoDescription', params: { item: label } });
  });
  cv.education.forEach((item, index) => {
    const label = item.course || item.institution || `#${index + 1}`;
    if (!item.course.trim()) issues.push({ key: 'educationNoCourse', params: { item: label } });
    if (!item.institution.trim()) issues.push({ key: 'educationNoInstitution', params: { item: label } });
  });
  return result('entries', issues);
};

const checkResults = (cv: CVData) => {
  const issues: AtsIssue[] = [];
  for (const item of cv.experience) {
    if (!item.description.trim()) continue;
    const label = item.role || item.company;
    const blocks = parseDescription(item.description);
    if (blocks.some((block) => block.text.length > MAX_LINE_LENGTH)) issues.push({ key: 'longParagraph', params: { item: label } });
    if (!/\d/.test(item.description)) issues.push({ key: 'noNumbers', params: { item: label } });
  }
  return result('results', issues);
};

const LIST_MIN_ITEMS = 5;
const LIST_ITEM_MAX_WORDS = 3;

const looksLikeList = (line: string) =>
  line.endsWith(':') ||
  line.split(',').filter((part) => {
    const words = part.trim().split(/\s+/).filter(Boolean).length;
    return words > 0 && words <= LIST_ITEM_MAX_WORDS;
  }).length >= LIST_MIN_ITEMS;

const checkSkills = (cv: CVData) => {
  const issues: AtsIssue[] = [];
  const skills = lines(cv.skills);
  if (skills.length > 0 && skills.length < MIN_SKILLS) issues.push({ key: 'fewSkills', params: { count: skills.length, min: MIN_SKILLS } });
  for (const skill of skills.filter((line) => line.length > MAX_SKILL_LENGTH).slice(0, 2)) {
    issues.push({ key: 'longSkill', params: { skill: `${skill.slice(0, MAX_SKILL_LENGTH)}…` } });
  }
  if (lines(cv.objective).some(looksLikeList)) issues.push({ key: 'skillsInProfile' });
  return result('skills', issues);
};

const checkLanguage = (cv: CVData) => {
  const issues: AtsIssue[] = [];
  const detected = guessResumeLocale(cv);
  if (cv.locale && detected && detected !== cv.locale) issues.push({ key: 'languageMismatch' });
  const parts = [
    cv.objective,
    cv.experience.map((item) => item.description).join('\n'),
    cv.education.map((item) => `${item.course}\n${item.topics ?? ''}`).join('\n'),
  ];
  const locales = new Set(parts.map(guessTextLocale).filter(Boolean));
  if (locales.size > 1) issues.push({ key: 'mixedLanguages' });
  return result('language', issues);
};

const checkPages = (readBack: ReadBack) =>
  result('pages', readBack.pages > MAX_PAGES ? [{ key: 'tooManyPages', params: { count: readBack.pages, max: MAX_PAGES } }] : []);

const checkCharacters = (readBack: ReadBack) =>
  result('characters', readBack.text.includes('�') ? [{ key: 'lostCharacters' }] : []);

export const readBackFrom = (content: PdfContent): ReadBack => {
  let id = 0;
  const { cv, unmatched } = parseResume(content, () => `ats-${++id}`);
  return {
    cv,
    unmatched,
    text: content.lines.map((line) => line.text).join('\n'),
    pages: content.lines.reduce((max, line) => Math.max(max, line.page), 0),
  };
};

export const analyzeResume = (cv: CVData, readBack: ReadBack, today = new Date()): AtsRuleResult[] => [
  checkReadable(readBack),
  checkReadBack(cv, readBack),
  checkContact(cv),
  checkHeadline(cv),
  checkLinks(cv),
  checkSections(cv),
  checkDates(cv, today),
  checkEntries(cv),
  checkResults(cv),
  checkSkills(cv),
  checkLanguage(cv),
  checkPages(readBack),
  checkCharacters(readBack),
];
