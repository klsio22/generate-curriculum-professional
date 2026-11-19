import { beforeAll, describe, expect, it } from 'vitest';
import type { CVData } from '@/types/cv';
import { defaultCV } from '@/features/cv-editor/defaultCV';
import { buildPdfMetadata } from '@/features/pdf/pdfMetadata';
import { parseDescription } from '@/features/pdf/textUtils';
import { detectResumeLocale } from '@/shared/locale';
import { analyzeResume, readBackFrom } from '@/features/ats/atsRules';
import type { PdfContent } from './extractPdf';
import { initPdfI18n, plainUrl, readBack, renderPdfContent } from './testing/readBack';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MAX_PAGES = 2;
const MIN_SKILLS = 8;

const monthIndex = (date: string): number | null => {
  const [month, year, ...rest] = date.split(' ');
  const index = MONTHS.indexOf(month);
  if (rest.length > 0 || index < 0 || !/^\d{4}$/.test(year ?? '')) return null;
  return Number(year) * 12 + index;
};

const now = new Date();
const thisMonth = now.getFullYear() * 12 + now.getMonth();

const periods = (cv: CVData) => [
  ...cv.experience.map((item) => ({ label: item.role, start: item.startDate, end: item.endDate, current: true })),
  ...cv.education.map((item) => ({ label: item.course, start: item.startDate, end: item.endDate, current: false })),
  ...(cv.projects ?? []).map((item) => ({ label: item.name, start: item.startDate, end: item.endDate, current: false })),
];

const textOf = (content: PdfContent) => content.lines.map((line) => line.text).join('\n');

let read: Awaited<ReturnType<typeof readBack>>;

beforeAll(async () => {
  await initPdfI18n();
  read = await readBack(defaultCV, 'pt-BR');
}, 30_000);

describe('sample resume: ATS checklist', () => {
  it('the ATS check in the app finds nothing to fix in the generated PDF', () => {
    const results = analyzeResume(defaultCV, readBackFrom(read.content));
    expect(results.filter((rule) => !rule.ok)).toEqual([]);
  });

  it('every line of the PDF is read into a field', () => {
    expect(read.unmatched).toEqual([]);
  });

  it('contact data is complete and read back as typed', () => {
    expect(read.cv.fullName).toBe(defaultCV.fullName);
    expect(read.cv.jobTitle).toBe(defaultCV.jobTitle);
    expect(read.cv.email).toBe(defaultCV.email);
    expect(read.cv.email).toMatch(/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/);
    expect(read.cv.phone).toBe(defaultCV.phone);
    expect(read.cv.phone).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
    expect(read.cv.address).toBe(defaultCV.address);
    expect(read.cv.address).toMatch(/^[^,]+, [A-Z]{2}$/);
  });

  it('links are printed as their address, so a text-only reader keeps them', () => {
    const text = textOf(read.content);
    for (const url of [defaultCV.linkedin, defaultCV.github, defaultCV.portfolio]) {
      expect(text).toContain(plainUrl(url));
    }
    expect(plainUrl(read.cv.linkedin)).toBe(plainUrl(defaultCV.linkedin));
    expect(plainUrl(read.cv.github)).toBe(plainUrl(defaultCV.github));
    expect(plainUrl(read.cv.portfolio)).toBe(plainUrl(defaultCV.portfolio));
  });

  it('standard sections are recognized and not empty', () => {
    expect(read.cv.objective).toBe(defaultCV.objective);
    expect(read.cv.experience).toHaveLength(defaultCV.experience.length);
    expect(read.cv.education).toHaveLength(defaultCV.education.length);
    expect(read.cv.projects).toHaveLength(defaultCV.projects?.length ?? 0);
    expect(read.cv.skills).toBe(defaultCV.skills);
    expect(read.cv.languages).toBe(defaultCV.languages);
    expect(read.cv.softSkills).toBe(defaultCV.softSkills);
  });

  it('every period has dates in one format ("Mmm AAAA"), in order and not in the future', () => {
    for (const period of periods(defaultCV)) {
      const start = monthIndex(period.start ?? '');
      const end = period.end ? monthIndex(period.end) : thisMonth;
      expect(start, `${period.label}: start "${period.start}"`).not.toBeNull();
      expect(end, `${period.label}: end "${period.end}"`).not.toBeNull();
      if (!period.end) expect(period.current, `${period.label}: only a job can be current`).toBe(true);
      expect(start!, `${period.label}: starts after it ends`).toBeLessThanOrEqual(end!);
      expect(end!, `${period.label}: ends in the future`).toBeLessThanOrEqual(thisMonth);
    }
    expect(read.cv.experience.map((item) => [item.startDate, item.endDate])).toEqual(
      defaultCV.experience.map((item) => [item.startDate, item.endDate]),
    );
    expect(read.cv.education.map((item) => [item.startDate, item.endDate])).toEqual(
      defaultCV.education.map((item) => [item.startDate, item.endDate]),
    );
  });

  it('every entry has its title, organization and description', () => {
    for (const item of defaultCV.experience) {
      expect([item.role, item.company, item.description].every((value) => value.trim())).toBe(true);
    }
    for (const item of defaultCV.education) {
      expect([item.course, item.institution, item.topics ?? ''].every((value) => value.trim())).toBe(true);
    }
  });

  it('each job lists its results as bullet items, each with a number', () => {
    for (const item of defaultCV.experience) {
      const items = parseDescription(item.description).filter((block) => block.kind === 'item');
      expect(items.length, item.role).toBeGreaterThan(0);
      for (const block of items) expect(block.text, item.role).toMatch(/\d/);
    }
    expect(read.cv.experience.map((item) => item.description)).toEqual(defaultCV.experience.map((item) => item.description));
  });

  it('accented text is extracted without losing characters', () => {
    const text = textOf(read.content);
    expect(text).not.toContain('�');
    expect(text).toContain(defaultCV.address);
    expect(read.cv.interpersonalSkills).toBe(defaultCV.interpersonalSkills);
    expect(read.cv.education.map((item) => item.topics)).toEqual(defaultCV.education.map((item) => item.topics));
  });

  it('skills are a plain list with the technologies the profile names', () => {
    const skills = (defaultCV.skills ?? '').split('\n');
    expect(skills.length).toBeGreaterThanOrEqual(MIN_SKILLS);
    for (const skill of skills) expect(skill.trim()).toBe(skill);
    for (const skill of ['C#', '.NET', 'Java', 'Ruby on Rails']) {
      expect(defaultCV.objective).toContain(skill);
      expect(skills).toContain(skill);
    }
  });

  it('the whole resume is in one language', () => {
    expect(detectResumeLocale(defaultCV, 'en')).toBe('pt-BR');
  });

  it(`fits in ${MAX_PAGES} pages`, () => {
    expect(Math.max(...read.content.lines.map((line) => line.page))).toBeLessThanOrEqual(MAX_PAGES);
  });

  it('PDF metadata names the candidate, the role and the skills', () => {
    const metadata = buildPdfMetadata(defaultCV, 'pt-BR', 'Currículo');
    expect(metadata.title).toContain(defaultCV.fullName);
    expect(metadata.title).toContain(defaultCV.jobTitle);
    expect(metadata.author).toBe(defaultCV.fullName);
    expect(metadata.keywords).toContain('Java');
  });

  it('a current job ends in the resume language', async () => {
    const english = textOf(await renderPdfContent(defaultCV, 'en'));
    expect(english).toContain('Jan 2022 - Current');
    expect(english).not.toContain('Atual');
  }, 30_000);
});
