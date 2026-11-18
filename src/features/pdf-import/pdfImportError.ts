export type PdfImportErrorCode = 'not_pdf' | 'protected' | 'no_text';

export class PdfImportError extends Error {
  readonly code: PdfImportErrorCode;

  constructor(code: PdfImportErrorCode) {
    super(code);
    this.name = 'PdfImportError';
    this.code = code;
  }
}

export const pdfImportErrorCode = (error: unknown): PdfImportErrorCode =>
  error instanceof PdfImportError ? error.code : 'not_pdf';
