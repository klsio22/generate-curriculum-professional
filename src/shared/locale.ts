import type { CVData, ResumeLocale } from '@/types/cv';

export const RESUME_LOCALES: readonly ResumeLocale[] = ['pt-BR', 'en'];

export const isResumeLocale = (value: unknown): value is ResumeLocale =>
  value === 'pt-BR' || value === 'en';

export const toResumeLocale = (language: string): ResumeLocale =>
  language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';

export const resumeLocaleOf = (cv: Pick<CVData, 'locale'>, fallbackLanguage: string): ResumeLocale =>
  cv.locale ?? toResumeLocale(fallbackLanguage);

const PT_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'que', 'uma', 'um', 'na', 'nas', 'nos', 'ao',
  'pela', 'pelo', 'não', 'atual', 'experiência', 'formação', 'desenvolvimento', 'sistemas', 'projetos',
]);

const EN_WORDS = new Set([
  'the', 'and', 'of', 'with', 'for', 'in', 'to', 'on', 'at', 'my', 'is', 'are', 'an', 'present',
  'experience', 'education', 'development', 'systems', 'projects',
]);

export const guessTextLocale = (text: string): ResumeLocale | null => {
  let pt = 0;
  let en = 0;
  for (const [word] of text.toLowerCase().matchAll(/\p{L}+/gu)) {
    if (PT_WORDS.has(word)) pt += 1;
    else if (EN_WORDS.has(word)) en += 1;
  }
  if (pt === en) return null;
  return pt > en ? 'pt-BR' : 'en';
};

const resumeText = (cv: Partial<CVData>) =>
  [
    cv.jobTitle,
    cv.objective,
    ...(cv.experience ?? []).flatMap((item) => [item.role, item.description]),
    ...(cv.education ?? []).flatMap((item) => [item.course, item.topics]),
  ]
    .filter(Boolean)
    .join('\n');

export const detectResumeLocale = (cv: Partial<CVData>, fallbackLanguage: string): ResumeLocale =>
  cv.locale ?? guessTextLocale(resumeText(cv)) ?? toResumeLocale(fallbackLanguage);

export const otherLocale = (locale: ResumeLocale): ResumeLocale => (locale === 'pt-BR' ? 'en' : 'pt-BR');
