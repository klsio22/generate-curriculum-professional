import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { renderToBuffer } from '@react-pdf/renderer';
import { getDocument, VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { CVData, ResumeLocale } from '@/types/cv';
import { ptBR } from '@/i18n/locales/pt-BR';
import { en } from '@/i18n/locales/en';
import { CVDocument } from '@/features/pdf/CVDocument';
import { extractPdfContent } from '../extractPdf';
import { parseResume } from '../parseResume';

export const initPdfI18n = () =>
  i18next.use(initReactI18next).init({
    lng: 'pt-BR',
    showSupportNotice: false,
    resources: { 'pt-BR': { translation: ptBR }, en: { translation: en } },
  });

export const renderPdfContent = async (cv: CVData, language: ResumeLocale) => {
  await i18next.changeLanguage(language);
  const buffer = await renderToBuffer(<CVDocument data={{ ...cv, locale: language }} />);
  const task = getDocument({ data: new Uint8Array(buffer), verbosity: VerbosityLevel.ERRORS });
  const content = await extractPdfContent(await task.promise);
  await task.destroy();
  return content;
};

export const readBack = async (cv: CVData, language: ResumeLocale) => {
  const content = await renderPdfContent(cv, language);
  let id = 0;
  return { ...parseResume(content, () => `id-${++id}`), content };
};

export const plainUrl = (url?: string) =>
  (url ?? '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
