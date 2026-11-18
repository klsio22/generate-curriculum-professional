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

describe('parseResume with the layout of a LinkedIn PDF', () => {
  const line = (text: string, page: number, x: number, y: number, fontSize: number, right: number): PdfLine => ({
    text, page, x, y, fontSize, right, bold: false, italic: false,
  });
  const lines: PdfLine[] = [
    line('Contato', 1, 22, 738, 13, 67),
    line('Curitiba', 1, 22, 718, 10.5, 60),
    line('ana.lima@mail.com', 1, 22, 706, 10.5, 127),
    line('www.linkedin.com/in/ana-', 1, 22, 681, 11, 150),
    line('lima-123 (LinkedIn)', 1, 22, 667, 11, 140),
    line('Principais competências', 1, 22, 618, 13, 162),
    line('React', 1, 22, 599, 10.5, 50),
    line('Node.js', 1, 22, 581, 10.5, 60),
    line('Ana Lima', 1, 224, 726, 26, 330),
    line('Desenvolvedora Front-end | React • TypeScript', 1, 224, 705, 12, 460),
    line('Curitiba, Paraná, Brasil', 1, 224, 675, 12, 340),
    line('Resumo', 1, 224, 638, 15.8, 282),
    line('Desenvolvedora com quatro anos de experiência em aplicações web e', 1, 224, 612, 12, 586),
    line('mobile.', 1, 224, 594, 12, 262),
    line('Experiência', 1, 224, 560, 15.8, 306),
    line('Empresa Alfa', 1, 224, 530, 12, 290),
    line('3 anos 9 meses', 1, 224, 515, 10.5, 300),
    line('Desenvolvedora Front-end Pleno', 1, 224, 499, 11.5, 380),
    line('março de 2024 - Present (1 ano 9 meses)', 1, 224, 484, 10.5, 410),
    line('Curitiba, Paraná, Brasil', 1, 224, 469, 10.5, 330),
    line('Criei a biblioteca de componentes usada por todos os times do produto e', 1, 224, 448, 10.5, 589),
    line('documentei os padrões de acessibilidade.', 1, 224, 430, 10.5, 420),
    line('Reduzi o tempo de carregamento das páginas principais do produto, com', 1, 224, 30, 10.5, 585),
    line('Page 1 of 2', 1, 384, 14, 9, 430),
    line('ganho de 40% nas métricas de Core Web Vitals.', 2, 224, 738, 10.5, 440),
    line('Desenvolvedora Front-end', 2, 224, 700, 11.5, 350),
    line('março de 2023 - fevereiro de 2024 (1 ano)', 2, 224, 685, 10.5, 420),
    line('Mantive o design system.', 2, 224, 664, 10.5, 360),
    line('Empresa Beta', 2, 224, 626, 12, 290),
    line('Desenvolvedora Júnior', 2, 224, 610, 11.5, 340),
    line('janeiro de 2021 - fevereiro de 2023 (2 anos 2 meses)', 2, 224, 595, 10.5, 470),
    line('Remoto', 2, 224, 580, 10.5, 260),
    line('Mantive telas em React e TypeScript.', 2, 224, 559, 10.5, 400),
    line('Formação acadêmica', 2, 224, 516, 15.8, 375),
    line('Universidade Federal do Paraná', 2, 224, 490, 12, 400),
    line('Bacharelado, Ciência da Computação · (2016 - 2020)', 2, 224, 473, 10.5, 470),
    line('Page 2 of 2', 2, 384, 14, 9, 430),
  ];
  const linkedinUrl = 'https://www.linkedin.com/in/ana-lima-123?trk=public_profile';
  const links: PdfLink[] = [
    { url: 'mailto:ana.lima@mail.com', text: 'ana.lima@mail.com' },
    { url: linkedinUrl, text: 'www.linkedin.com/in/ana-' },
    { url: linkedinUrl, text: 'lima-123 (LinkedIn)' },
  ];

  it('reads the header from the main column, after the sidebar', () => {
    const { cv } = parse(lines, links);
    expect(cv.fullName).toBe('Ana Lima');
    expect(cv.jobTitle).toBe('Desenvolvedora Front-end | React • TypeScript');
    expect(cv.address).toBe('Curitiba, Paraná, Brasil');
    expect(cv.email).toBe('ana.lima@mail.com');
    expect(cv.linkedin).toBe('https://www.linkedin.com/in/ana-lima-123');
    expect(cv.linkedinName).toBe('');
    expect(cv.objective).toBe('Desenvolvedora com quatro anos de experiência em aplicações web e mobile.');
    expect(cv.skills).toBe('React\nNode.js');
  });

  it('keeps company and role together, also with two roles in one company', () => {
    const { cv, unmatched } = parse(lines, links);
    expect(cv.experience.map(({ role, company, startDate, endDate }) => [role, company, startDate, endDate])).toEqual([
      ['Desenvolvedora Front-end Pleno', 'Empresa Alfa', 'março de 2024', ''],
      ['Desenvolvedora Front-end', 'Empresa Alfa', 'março de 2023', 'fevereiro de 2024'],
      ['Desenvolvedora Júnior', 'Empresa Beta', 'janeiro de 2021', 'fevereiro de 2023'],
    ]);
    expect(cv.experience[0].description).toBe(
      'Criei a biblioteca de componentes usada por todos os times do produto e documentei os padrões de acessibilidade.\n' +
        'Reduzi o tempo de carregamento das páginas principais do produto, com ganho de 40% nas métricas de Core Web Vitals.',
    );
    expect(cv.experience[2].description).toBe('Mantive telas em React e TypeScript.');
    expect(unmatched).toEqual([]);
  });

  it('reads the course and dates written on one line', () => {
    const { cv } = parse(lines, links);
    expect(cv.education).toEqual([
      {
        id: expect.any(String),
        institution: 'Universidade Federal do Paraná',
        course: 'Bacharelado, Ciência da Computação',
        startDate: '2016',
        endDate: '2020',
        topics: '',
      },
    ]);
  });
});
