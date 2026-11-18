import { getDocument, GlobalWorkerOptions, VerbosityLevel } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { extractPdfContent, type PdfContent } from './extractPdf';
import { parseResume, type ImportedResume } from './parseResume';
import { PdfImportError } from './pdfImportError';

GlobalWorkerOptions.workerSrc = workerUrl;

export const importResumePdf = async (file: File): Promise<ImportedResume> => {
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    verbosity: VerbosityLevel.ERRORS,
    disableFontFace: true,
  });
  let content: PdfContent;
  try {
    content = await extractPdfContent(await task.promise);
  } catch (error) {
    throw new PdfImportError(error instanceof Error && error.name === 'PasswordException' ? 'protected' : 'not_pdf');
  } finally {
    await task.destroy();
  }
  if (content.lines.length === 0) throw new PdfImportError('no_text');
  return parseResume(content);
};
