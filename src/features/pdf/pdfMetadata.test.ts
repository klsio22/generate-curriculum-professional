import { describe, expect, it } from 'vitest';
import type { CVData } from '@/types/cv';
import { buildPdfFileName, buildPdfMetadata } from './pdfMetadata';

const cv = (overrides: Partial<CVData> = {}): CVData => ({
  fullName: 'Ana Souza',
  jobTitle: 'Desenvolvedora Front-end',
  address: '', phone: '', email: '', linkedin: '',
  objective: '',
  skills: 'React, TypeScript\n- Testes automatizados\nReact',
  education: [], experience: [],
  ...overrides,
});

describe('buildPdfMetadata', () => {
  it('uses the job keywords of a tailored resume', () => {
    const meta = buildPdfMetadata(
      cv({ meta: { targetJob: 'Front-end Pleno', company: 'Acme', keywords: ['React', 'Next.js'] } }),
      'pt-BR',
      'Currículo',
    );
    expect(meta).toEqual({
      title: 'Ana Souza — Desenvolvedora Front-end',
      author: 'Ana Souza',
      subject: 'Currículo — Front-end Pleno — Acme',
      keywords: 'React, Next.js',
      language: 'pt-BR',
      creator: 'Curriculum Generator',
    });
  });

  it('falls back to the skills list without duplicates', () => {
    const meta = buildPdfMetadata(cv(), 'en', 'Resume');
    expect(meta.keywords).toBe('React, TypeScript, Testes automatizados');
    expect(meta.subject).toBe('Resume — Desenvolvedora Front-end');
  });
});

describe('buildPdfFileName', () => {
  it('joins name, role and company without accents or symbols', () => {
    expect(buildPdfFileName(cv({ fullName: 'João Ávila', meta: { targetJob: 'Dev C#/.NET', company: 'Acme S.A.' } }), 'x'))
      .toBe('Joao_Avila_Dev_C_NET_Acme_S_A.pdf');
  });

  it('falls back to the document title', () => {
    expect(buildPdfFileName(cv({ fullName: '', jobTitle: '' }), 'Meu currículo')).toBe('Meu_curriculo.pdf');
    expect(buildPdfFileName(cv({ fullName: '', jobTitle: '' }), '')).toBe('curriculo.pdf');
  });
});
