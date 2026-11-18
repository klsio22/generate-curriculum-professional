import { describe, expect, it } from 'vitest';
import type { PdfContent, PdfLine, PdfLink } from './extractPdf';
import { isDateText, parseDateRange, parseResume } from './parseResume';

const page = (specs: (string | [string, Partial<PdfLine>])[]): PdfLine[] => {
  let y = 800;
  return specs.map((spec) => {
    const [text, options] = typeof spec === 'string' ? [spec, {}] : spec;
    y -= 14;
    return { text, fontSize: 10, bold: false, italic: false, page: 1, x: 40, right: 40 + text.length * 4, y, ...options };
  });
};

const parse = (lines: PdfLine[], links: PdfLink[] = []) => {
  let id = 0;
  return parseResume({ lines, links } satisfies PdfContent, () => `id-${++id}`);
};

describe('isDateText', () => {
  it.each(['Jan 2020 - Atual', 'Maio de 2030 - Maio de 2032', '03/2019 – 12/2021', '2016 - 2020', 'Atual', 'Sep. 2018 to Present', '2014'])(
    'accepts "%s"',
    (text) => expect(isDateText(text)).toBe(true),
  );

  it.each(['Atualmente estudando inglês', 'React 2020', 'Rua das Flores, 2020', 'Desenvolvedora de Software'])(
    'rejects "%s"',
    (text) => expect(isDateText(text)).toBe(false),
  );
});

describe('parseDateRange', () => {
  it('splits the range and leaves the end empty for current jobs', () => {
    expect(parseDateRange('Jan 2020 - Atual')).toEqual({ start: 'Jan 2020', end: '' });
    expect(parseDateRange('Mar 2018 até Dez 2019')).toEqual({ start: 'Mar 2018', end: 'Dez 2019' });
    expect(parseDateRange('- 2020')).toEqual({ start: '', end: '2020' });
    expect(parseDateRange('2014')).toEqual({ start: '2014', end: '' });
  });
});

describe('parseResume with a layout from another generator', () => {
  const lines = page([
    ['João Pereira', { fontSize: 20, bold: true }],
    'Analista de Dados',
    'Curitiba, PR | (41) 99876-5432 | joao.pereira@mail.com | linkedin.com/in/joaop',
    ['RESUMO', { bold: true }],
    'Analista com cinco anos de experiência em BI.',
    ['EXPERIÊNCIA', { bold: true }],
    'Analista de Dados Sênior',
    'Banco Exemplo | Jan 2021 - Atual',
    '• Criei painéis em Power BI',
    '• Automatizei relatórios com Python',
    'Analista de Dados',
    'Varejo SA | 2018 - 2020',
    '• Modelei o data warehouse',
    ['FORMAÇÃO', { bold: true }],
    'Estatística - Universidade Estadual',
    '2013 - 2017',
    ['HABILIDADES', { bold: true }],
    'SQL • Python • Power BI',
    ['CERTIFICAÇÕES', { bold: true }],
    'AWS Cloud Practitioner',
  ]);

  it('fills the header from tokens on one line', () => {
    const { cv } = parse(lines);
    expect(cv.fullName).toBe('João Pereira');
    expect(cv.jobTitle).toBe('Analista de Dados');
    expect(cv.address).toBe('Curitiba, PR');
    expect(cv.phone).toBe('(41) 99876-5432');
    expect(cv.email).toBe('joao.pereira@mail.com');
    expect(cv.linkedin).toBe('linkedin.com/in/joaop');
  });

  it('splits experiences by their dates, with the date on the company line', () => {
    const { cv } = parse(lines);
    expect(cv.experience).toEqual([
      {
        id: 'id-1',
        role: 'Analista de Dados Sênior',
        company: 'Banco Exemplo',
        startDate: 'Jan 2021',
        endDate: '',
        description: 'Criei painéis em Power BI\nAutomatizei relatórios com Python',
      },
      {
        id: 'id-2',
        role: 'Analista de Dados',
        company: 'Varejo SA',
        startDate: '2018',
        endDate: '2020',
        description: 'Modelei o data warehouse',
      },
    ]);
  });

  it('reads the other sections and keeps unknown ones out of the fields', () => {
    const { cv, unmatched } = parse(lines);
    expect(cv.objective).toBe('Analista com cinco anos de experiência em BI.');
    expect(cv.education).toHaveLength(1);
    expect(cv.education[0]).toMatchObject({ institution: 'Estatística - Universidade Estadual', startDate: '2013', endDate: '2017' });
    expect(cv.skills).toBe('SQL\nPython\nPower BI');
    expect(unmatched).toEqual(['CERTIFICAÇÕES', 'AWS Cloud Practitioner']);
  });
});

describe('parseResume details', () => {
  it('returns an empty resume when the PDF has no text', () => {
    const { cv, unmatched } = parse([]);
    expect(cv.fullName).toBe('');
    expect(cv.experience).toEqual([]);
    expect(unmatched).toEqual([]);
  });

  it('joins a line that fills the width with the next one', () => {
    const lines = page([
      ['Maria Silva', { fontSize: 18 }],
      'PERFIL',
      ['Primeira linha que ocupa a largura toda da página e continua', { right: 555 }],
      'na linha de baixo.',
      'Segundo parágrafo curto.',
    ]);
    expect(parse(lines).cv.objective).toBe(
      'Primeira linha que ocupa a largura toda da página e continua na linha de baixo.\nSegundo parágrafo curto.',
    );
  });

  it('skips the row of link texts and keeps the link names', () => {
    const lines = page([
      ['Maria Silva', { fontSize: 18 }],
      'maria@site.com',
      'meu-linkedin maria',
      'PERFIL',
      'Texto.',
    ]);
    const links = [
      { url: 'https://www.linkedin.com/in/maria', text: 'meu-linkedin' },
      { url: 'https://github.com/maria', text: 'maria' },
    ];
    const { cv, unmatched } = parse(lines, links);
    expect(cv.email).toBe('maria@site.com');
    expect(cv.linkedinName).toBe('meu-linkedin');
    expect(cv.github).toBe('https://github.com/maria');
    expect(cv.githubName).toBe('maria');
    expect(cv.address).toBe('');
    expect(unmatched).toEqual([]);
  });
});
