import type { CVData, Education, Experience, Project, Reference } from '@/types/cv';
import type { PdfContent, PdfLine, PdfLink } from './extractPdf';

type SectionKey =
  | 'contact'
  | 'objective'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'languages'
  | 'softSkills'
  | 'interpersonalSkills'
  | 'references'
  | 'other';

export interface ImportedResume {
  cv: CVData;
  unmatched: string[];
}

interface Paragraph {
  text: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
}

interface Section {
  key: SectionKey;
  heading: string;
  lines: PdfLine[];
}

interface DateRange {
  start: string;
  end: string;
}

interface Entry {
  title: string;
  subtitle: string;
  date: DateRange | null;
  body: Paragraph[];
}

const HEADINGS: Record<SectionKey, string[]> = {
  contact: ['contato', 'contatos', 'informacoes de contato', 'dados pessoais', 'contact', 'contact information', 'personal information', 'personal details'],
  objective: [
    'perfil', 'perfil profissional', 'resumo', 'resumo profissional', 'objetivo', 'objetivo profissional', 'sobre mim', 'sobre',
    'profile', 'professional profile', 'summary', 'professional summary', 'objective', 'about me', 'about',
  ],
  experience: [
    'experiencia profissional', 'experiencias profissionais', 'experiencia', 'experiencias', 'historico profissional',
    'professional experience', 'experience', 'work experience', 'employment history', 'work history',
  ],
  education: [
    'formacao academica', 'formacao', 'educacao', 'escolaridade', 'formacao academica e cursos',
    'academic education', 'education', 'academic background',
  ],
  projects: [
    'projetos academicos e tecnicos', 'projetos', 'projetos pessoais', 'projetos academicos', 'principais projetos',
    'academic and technical projects', 'projects', 'personal projects', 'academic projects',
  ],
  skills: [
    'competencias tecnicas', 'habilidades tecnicas', 'habilidades', 'competencias', 'conhecimentos', 'conhecimentos tecnicos',
    'tecnologias', 'hard skills', 'technical skills', 'skills', 'technologies', 'tech stack',
  ],
  languages: ['idiomas', 'linguas', 'languages'],
  softSkills: ['soft skills', 'habilidades comportamentais', 'competencias comportamentais'],
  interpersonalSkills: [
    'competencias interpessoais demonstradas', 'competencias interpessoais', 'habilidades interpessoais',
    'demonstrated interpersonal competencies', 'interpersonal competencies', 'interpersonal skills',
  ],
  references: ['referencias', 'referencias profissionais', 'references', 'professional references'],
  other: [
    'certificacoes', 'certificados', 'cursos', 'cursos complementares', 'atividades complementares', 'voluntariado',
    'premios', 'publicacoes', 'interesses', 'informacoes adicionais', 'certifications', 'courses', 'volunteer',
    'volunteering', 'awards', 'publications', 'interests', 'additional information', 'hobbies',
  ],
};

const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[:\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

const HEADING_BY_TEXT = new Map<string, SectionKey>(
  (Object.entries(HEADINGS) as [SectionKey, string[]][]).flatMap(([key, names]) => names.map((name) => [name, key])),
);

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
const PHONE = /\+?\(?\d[\d\s().-]{6,}\d/;
const URL_TOKEN = /^(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#]\S*)?$/i;
const BULLET = /^[•●▪◦‣∙·*–—-]\s+/;
const LABEL = /^(?:e-?mail|telefone|phone|tel|celular|whatsapp|linkedin|github|portf[oó]lio|site|website|endere[cç]o|address)\s*:\s*/i;
const MONTH_WORDS =
  /\b(?:jan|fev|feb|mar|abr|apr|mai|may|jun|jul|ago|aug|set|sep|sept|out|oct|nov|dez|dec|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|june|july|august|september|october|november|december|de|of)\.?\b/g;
const PRESENT_WORDS = /\b(?:atual|atualmente|presente|o momento|hoje|current|present|now|today)\b/g;
const RANGE_SEPARATOR = /\s+[–—-]\s+|\s*[–—]\s*|\s+(?:ate|até|to|a)\s+/i;

const phoneDigits = (text: string) => text.replace(/\D/g, '').length;
const isEmail = (text: string) => EMAIL.test(text);
const isPhone = (text: string) => PHONE.test(text) && phoneDigits(text) >= 8 && phoneDigits(text) <= 15 && !/[a-z]{3}/i.test(text);
const stripUrl = (url: string) => url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '').toLowerCase();
const stripBullet = (text: string) => text.replace(BULLET, '').trim();

export const isDateText = (text: string): boolean => {
  const normalized = normalize(text);
  if (!normalized || normalized.length > 45) return false;
  const hasYear = /\b(?:19|20)\d{2}\b/.test(normalized);
  const hasPresent = new RegExp(PRESENT_WORDS.source).test(normalized);
  if (!hasYear && !hasPresent) return false;
  const leftover = normalized
    .replace(MONTH_WORDS, '')
    .replace(PRESENT_WORDS, '')
    .replace(/\b(?:ate|to|a)\b/g, '')
    .replace(/[\d\s/.,()–—-]/g, '');
  return leftover.length === 0;
};

export const parseDateRange = (text: string): DateRange => {
  const cleaned = text.trim().replace(/^\(|\)$/g, '');
  const present = (part: string) => new RegExp(`^(?:${PRESENT_WORDS.source})$`).test(normalize(part));
  if (/^[–—-]\s*/.test(cleaned)) {
    const end = cleaned.replace(/^[–—-]\s*/, '').trim();
    return { start: '', end: present(end) ? '' : end };
  }
  const [start, ...rest] = cleaned.split(RANGE_SEPARATOR);
  const end = rest.join(' ').trim();
  return { start: start.trim(), end: present(end) ? '' : end };
};

const splitTrailingDate = (text: string): { text: string; date: DateRange } | null => {
  const separators = [' | ', ' • ', ' · ', ', ', ' (', ' – ', ' — '];
  for (const separator of separators) {
    let index = text.indexOf(separator);
    while (index > 0) {
      const suffix = text.slice(index + separator.length).replace(/\)$/, '');
      if (isDateText(suffix)) return { text: text.slice(0, index).trim(), date: parseDateRange(suffix) };
      index = text.indexOf(separator, index + 1);
    }
  }
  return null;
};

const bodyFontSize = (lines: PdfLine[]): number => {
  const weight = new Map<number, number>();
  for (const line of lines) weight.set(line.fontSize, (weight.get(line.fontSize) ?? 0) + line.text.length);
  let best = 0;
  let bestWeight = -1;
  for (const [size, total] of weight) {
    if (total > bestWeight) {
      best = size;
      bestWeight = total;
    }
  }
  return best;
};

const looksLikeUnknownHeading = (line: PdfLine, body: number) => {
  const letters = line.text.replace(/[^\p{L}]/gu, '');
  return (
    letters.length >= 3 &&
    line.text === line.text.toUpperCase() &&
    line.text.split(/\s+/).length <= 6 &&
    !/\d|@/.test(line.text) &&
    (line.fontSize > body || line.bold)
  );
};

const splitSections = (lines: PdfLine[], body: number): { header: PdfLine[]; sections: Section[] } => {
  const header: PdfLine[] = [];
  const sections: Section[] = [];
  for (const line of lines) {
    const known = line.text.length <= 60 ? HEADING_BY_TEXT.get(normalize(line.text)) : undefined;
    if (known || (sections.length > 0 && looksLikeUnknownHeading(line, body))) {
      sections.push({ key: known ?? 'other', heading: line.text, lines: [] });
    } else if (sections.length === 0) {
      header.push(line);
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }
  return { header, sections };
};

const toParagraphs = (lines: PdfLine[], left: number, right: number): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  let previous: PdfLine | null = null;
  const fullWidth = right - (right - left) * 0.12;
  for (const line of lines) {
    const gap = previous ? previous.y - line.y : 0;
    const continues =
      previous !== null &&
      previous.page === line.page &&
      previous.fontSize === line.fontSize &&
      previous.bold === line.bold &&
      previous.italic === line.italic &&
      previous.right >= fullWidth &&
      gap > 0 &&
      gap <= line.fontSize * 1.6 &&
      !BULLET.test(line.text);
    if (continues) {
      paragraphs[paragraphs.length - 1].text += ` ${line.text}`;
    } else {
      paragraphs.push({ text: line.text, fontSize: line.fontSize, bold: line.bold, italic: line.italic });
    }
    previous = line;
  }
  return paragraphs;
};

const isDateParagraph = (paragraph?: Paragraph) => Boolean(paragraph && isDateText(paragraph.text));

const groupEntries = (paragraphs: Paragraph[], body: number): { entries: Paragraph[][]; leading: Paragraph[] } => {
  const larger = paragraphs.some((p) => p.fontSize > body);
  const someBold = paragraphs.some((p) => p.bold) && !paragraphs.every((p) => p.bold);
  let isTitle: ((p: Paragraph) => boolean) | null = null;
  if (larger) isTitle = (p) => p.fontSize > body;
  else if (someBold) isTitle = (p) => p.bold && !p.text.endsWith(':') && !BULLET.test(p.text);

  if (isTitle) {
    const entries: Paragraph[][] = [];
    const leading: Paragraph[] = [];
    for (const paragraph of paragraphs) {
      if (isTitle(paragraph)) entries.push([paragraph]);
      else if (entries.length > 0) entries[entries.length - 1].push(paragraph);
      else leading.push(paragraph);
    }
    return { entries, leading };
  }

  const dateIndexes = paragraphs
    .map((p, index) => (isDateText(p.text) || splitTrailingDate(p.text) ? index : -1))
    .filter((index) => index >= 0);
  if (dateIndexes.length === 0) return { entries: paragraphs.length ? [paragraphs] : [], leading: [] };

  const isHeaderLine = (p: Paragraph) => !BULLET.test(p.text) && p.text.length <= 80 && !/[.;]$/.test(p.text);
  const starts = dateIndexes.map((dateIndex, k) => {
    if (k === 0) return 0;
    const floor = dateIndexes[k - 1] + 1;
    let start = dateIndex;
    const inline = splitTrailingDate(paragraphs[dateIndex].text);
    const maxHeader = inline && inline.text ? 1 : 2;
    while (start > floor && dateIndex - start < maxHeader && isHeaderLine(paragraphs[start - 1])) start--;
    return start;
  });
  return {
    entries: starts.map((start, k) => paragraphs.slice(start, starts[k + 1] ?? paragraphs.length)),
    leading: [],
  };
};

const parseEntry = (group: Paragraph[]): Entry => {
  const [first, ...rest] = group;
  let title = first.text;
  let date: DateRange | null = null;
  const inlineTitle = splitTrailingDate(title);
  if (inlineTitle) {
    title = inlineTitle.text;
    date = inlineTitle.date;
  }

  let subtitle = '';
  const subtitleHasDate = Boolean(rest[0] && !date && splitTrailingDate(rest[0].text));
  if (rest[0] && !isDateParagraph(rest[0]) && (rest[0].italic || (!date && (isDateParagraph(rest[1]) || subtitleHasDate)))) {
    subtitle = rest.shift()!.text;
    const inlineSubtitle = date ? null : splitTrailingDate(subtitle);
    if (inlineSubtitle) {
      subtitle = inlineSubtitle.text;
      date = inlineSubtitle.date;
    }
  }
  if (!date && isDateParagraph(rest[0])) date = parseDateRange(rest.shift()!.text);
  if (!subtitle && date && rest[0]?.italic) subtitle = rest.shift()!.text;

  return { title: stripBullet(title), subtitle, date, body: rest };
};

const bodyLines = (body: Paragraph[]) => body.map((p) => stripBullet(p.text)).filter(Boolean);

const listItems = (paragraphs: Paragraph[]) =>
  paragraphs.flatMap((p) => stripBullet(p.text).split(/\s+[•|·]\s+/)).map((item) => item.trim()).filter(Boolean);

interface ContactFields {
  email: string;
  phone: string;
  urls: string[];
  leftovers: { text: string; line: PdfLine }[];
}

const readContactLines = (lines: PdfLine[], links: PdfLink[]): ContactFields => {
  const fields: ContactFields = { email: '', phone: '', urls: [], leftovers: [] };
  const linkTexts = links.map((link) => link.text).filter(Boolean);
  for (const line of lines) {
    let rest = line.text;
    for (const linkText of linkTexts) rest = rest.split(linkText).join(' ');
    if (linkTexts.length > 0 && !rest.trim()) continue;
    const tokens = line.text
      .split(/\s+[|•·]\s+|\s{3,}/)
      .map((token) => token.trim())
      .filter(Boolean);
    for (const raw of tokens) {
      const token = raw.replace(LABEL, '').trim();
      if (!token) continue;
      const email = token.match(EMAIL)?.[0];
      if (email) {
        if (!fields.email) fields.email = email;
        continue;
      }
      if (isPhone(token)) {
        if (!fields.phone) fields.phone = token;
        continue;
      }
      if (URL_TOKEN.test(token)) {
        fields.urls.push(token);
        continue;
      }
      fields.leftovers.push({ text: token, line });
    }
  }
  return fields;
};

const readProfileLinks = (links: PdfLink[], urlTokens: string[], cv: CVData) => {
  const candidates: PdfLink[] = [
    ...links.filter((link) => /^https?:/i.test(link.url)),
    ...urlTokens.map((url) => ({ url, text: '' })),
  ];
  const displayName = (link: PdfLink) => (link.text && stripUrl(link.text) !== stripUrl(link.url) ? link.text : '');
  const used = new Set<PdfLink>();
  const pick = (test: (link: PdfLink) => boolean) => {
    const link = candidates.find((candidate) => !used.has(candidate) && test(candidate));
    if (link) used.add(link);
    return link;
  };

  const linkedin = pick((link) => /linkedin\.com/i.test(link.url));
  const github = pick((link) => /github\.com\/[^/]+\/?$/i.test(link.url)) ?? pick((link) => /github\.com/i.test(link.url));
  const portfolio = pick((link) => !/linkedin\.com|github\.com/i.test(link.url));
  if (linkedin) {
    cv.linkedin = linkedin.url;
    cv.linkedinName = displayName(linkedin);
  }
  if (github) {
    cv.github = github.url;
    cv.githubName = displayName(github);
  }
  if (portfolio) {
    cv.portfolio = portfolio.url;
    cv.portfolioName = displayName(portfolio);
  }
};

const emptyResume = (): CVData => ({
  fullName: '',
  jobTitle: '',
  address: '',
  phone: '',
  email: '',
  linkedin: '',
  linkedinName: '',
  github: '',
  githubName: '',
  portfolio: '',
  portfolioName: '',
  objective: '',
  education: [],
  experience: [],
  projects: [],
  skills: '',
  languages: '',
  softSkills: '',
  interpersonalSkills: '',
  references: [],
});

const appendText = (current: string | undefined, next: string[]) => [current, ...next].filter(Boolean).join('\n');

const addEntry = (key: 'experience' | 'education' | 'projects' | 'references', entry: Entry, cv: CVData, unmatched: string[], newId: () => string) => {
  const lines = bodyLines(entry.body);
  if (key === 'experience') {
    const experience: Experience = {
      id: newId(),
      role: entry.title,
      company: entry.subtitle,
      startDate: entry.date?.start ?? '',
      endDate: entry.date?.end ?? '',
      description: lines.join('\n'),
    };
    cv.experience.push(experience);
  } else if (key === 'education') {
    const education: Education = {
      id: newId(),
      institution: entry.title,
      course: entry.subtitle,
      startDate: entry.date?.start ?? '',
      endDate: entry.date?.end ?? '',
      topics: lines
        .flatMap((line) => line.split(/\s*,\s*/))
        .filter(Boolean)
        .join('\n'),
    };
    cv.education.push(education);
  } else if (key === 'projects') {
    const linkLine = lines.find((line) => /^link\s*:/i.test(line));
    const project: Project = {
      id: newId(),
      name: entry.title,
      technologies: entry.subtitle,
      startDate: entry.date?.start ?? '',
      endDate: entry.date?.end ?? '',
      description: lines.filter((line) => line !== linkLine).join('\n'),
      link: linkLine ? linkLine.replace(/^link\s*:\s*/i, '') : '',
    };
    cv.projects!.push(project);
  } else {
    const all = [entry.title, entry.subtitle, ...lines].filter(Boolean);
    const email = all.map((line) => line.match(EMAIL)?.[0]).find(Boolean) ?? '';
    const phoneLine = all.find((line) => isPhone(line.replace(LABEL, '')));
    const reference: Reference = {
      id: newId(),
      name: entry.title,
      email,
      phone: phoneLine ? phoneLine.replace(LABEL, '').trim() : '',
    };
    if (!reference.email && !reference.phone && entry.title.split(/\s+/).length > 6) {
      unmatched.push(...all);
      return;
    }
    cv.references!.push(reference);
  }
};

export const parseResume = (
  content: PdfContent,
  newId: () => string = () => crypto.randomUUID(),
): ImportedResume => {
  const cv = emptyResume();
  const unmatched: string[] = [];
  const { lines, links } = content;
  if (lines.length === 0) return { cv, unmatched };

  const body = bodyFontSize(lines);
  const left = Math.min(...lines.map((line) => line.x));
  const right = Math.max(...lines.map((line) => line.right));
  const { header, sections } = splitSections(lines, body);

  const nameLine = header.reduce<PdfLine | null>(
    (best, line) => (!isEmail(line.text) && !isPhone(line.text) && (!best || line.fontSize > best.fontSize) ? line : best),
    null,
  );
  if (nameLine) cv.fullName = nameLine.text;

  const contactLines = [
    ...header.filter((line) => line !== nameLine),
    ...sections.filter((section) => section.key === 'contact').flatMap((section) => section.lines),
  ];
  const contact = readContactLines(contactLines, links);
  cv.email = contact.email;
  cv.phone = contact.phone;
  readProfileLinks(links, contact.urls, cv);

  const nameIndex = nameLine ? header.indexOf(nameLine) : -1;
  const jobTitle = contact.leftovers.find(
    ({ line }) => header.indexOf(line) === nameIndex + 1 || (header.includes(line) && line.fontSize > body),
  );
  if (jobTitle) cv.jobTitle = jobTitle.text;
  const remaining = contact.leftovers.filter((leftover) => leftover !== jobTitle);
  if (remaining[0]) cv.address = remaining[0].text;
  unmatched.push(...remaining.slice(1).map((leftover) => leftover.text));

  for (const section of sections) {
    if (section.key === 'contact') continue;
    const paragraphs = toParagraphs(section.lines, left, right);

    switch (section.key) {
      case 'objective':
        cv.objective = appendText(cv.objective, paragraphs.map((p) => p.text));
        break;
      case 'skills':
        cv.skills = appendText(cv.skills, listItems(paragraphs));
        break;
      case 'languages':
        cv.languages = appendText(cv.languages, listItems(paragraphs));
        break;
      case 'softSkills':
        cv.softSkills = appendText(cv.softSkills, listItems(paragraphs));
        break;
      case 'interpersonalSkills':
        cv.interpersonalSkills = appendText(cv.interpersonalSkills, bodyLines(paragraphs));
        break;
      case 'experience':
      case 'education':
      case 'projects':
      case 'references': {
        const { entries, leading } = groupEntries(paragraphs, body);
        unmatched.push(...leading.map((p) => p.text));
        for (const entry of entries.map(parseEntry)) addEntry(section.key, entry, cv, unmatched, newId);
        break;
      }
      default:
        unmatched.push(section.heading, ...paragraphs.map((p) => p.text));
    }
  }

  return { cv, unmatched };
};
