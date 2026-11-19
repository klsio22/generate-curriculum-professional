import { pdf } from '@react-pdf/renderer';
import { getDocument, GlobalWorkerOptions, VerbosityLevel } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { CVData } from '@/types/cv';
import { CVDocument } from '@/features/pdf/CVDocument';
import { extractPdfContent } from '@/features/pdf-import/extractPdf';
import { readBackFrom, type ReadBack } from './atsRules';

GlobalWorkerOptions.workerSrc = workerUrl;

export const readBackResume = async (cv: CVData): Promise<ReadBack> => {
  const blob = await pdf(<CVDocument data={cv} />).toBlob();
  const task = getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    verbosity: VerbosityLevel.ERRORS,
    disableFontFace: true,
  });
  try {
    return readBackFrom(await extractPdfContent(await task.promise));
  } finally {
    await task.destroy();
  }
};
