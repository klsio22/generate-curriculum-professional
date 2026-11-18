import type { CVData } from '@/types/cv';

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  language: string;
  creator: string;
}

const MAX_KEYWORDS = 20;

const lines = (text?: string) =>
  (text ?? '')
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

/**
 * Properties shown in the PDF's "Document properties". Some ATS read them, and
 * they make the file easy to identify. `resumeLabel` is "Currículo" / "Resume".
 */
export const buildPdfMetadata = (data: CVData, language: string, resumeLabel: string): PdfMetadata => {
  const name = data.fullName.trim();
  const role = (data.meta?.targetJob || data.jobTitle).trim();
  const company = data.meta?.company?.trim();

  const keywords = data.meta?.keywords?.length
    ? data.meta.keywords
    : lines(data.skills).flatMap((line) => line.split(/[,;]/)).map((k) => k.trim()).filter(Boolean);

  return {
    title: [name, data.jobTitle.trim()].filter(Boolean).join(' — ') || resumeLabel,
    author: name,
    subject: [resumeLabel, role, company].filter(Boolean).join(' — '),
    keywords: [...new Set(keywords)].slice(0, MAX_KEYWORDS).join(', '),
    language,
    creator: 'Curriculum Generator',
  };
};

const fileSafe = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/** e.g. "Ana_Souza_Desenvolvedora_Front-end_Acme.pdf"; falls back to the document title. */
export const buildPdfFileName = (data: CVData, fallbackTitle: string): string => {
  const parts = [data.fullName, data.meta?.targetJob || data.jobTitle, data.meta?.company]
    .map((part) => fileSafe(part ?? ''))
    .filter(Boolean);
  const base = parts.length > 0 ? parts.join('_') : fileSafe(fallbackTitle) || 'curriculo';
  return `${base.slice(0, 100)}.pdf`;
};
