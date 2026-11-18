import type { CVData, Education, Experience, Project, Reference } from '@/types/cv';
import { trimEndChars } from '@/shared/text';
import { guessTextLocale } from '@/shared/locale';
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
  lines: PdfLine[];
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
    'principais competencias', 'competencias principais', 'top skills',
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
    'honors-awards', 'honras e premios', 'licencas e certificados', 'licenses & certifications',
  ],
};

const normalize = (text: string): string =>
  trimEndChars(
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' '),
    ': ',
  ).trim();

const HEADING_BY_TEXT = new Map<string, SectionKey>(
  (Object.entries(HEADINGS) as [SectionKey, string[]][]).flatMap(([key, names]) => names.map((name) => [name, key])),
);

const EMAIL_TOKEN = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/;
const PHONE_TOKEN = /^\+?[\d\s().-]+$/;
const URL_START = /^(?:https?:\/\/|www\.)/i;
const DOMAIN = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;
const BULLET = /^[•●▪◦‣∙·*–—-]\s+/;
const LABEL = /^(?:e-?mail|telefone|phone|tel|celular|whatsapp|linkedin|github|portf[oó]lio|site|website|endere[cç]o|address)\s*:\s*/i;
const PAGE_FOOTER = /^(?:page|p[aá]gina)\s+\d+\s+(?:of|de)\s+\d+$/i;
const PLACE_WORDS = /\b(?:brasil|brazil|portugal|remoto|remote|hibrido|hybrid|presencial|on-site|home office|estados unidos|united states)\b/;
const DURATION_WORDS = /\b(?:anos?|mes|meses|years?|yrs?|months?|mos)\b/;
const RANGE_SEPARATOR = / [–—-] |[–—]| (?:ate|até|to|a) /i;

const COMMON_TLDS = new Set(['com', 'br', 'dev', 'io', 'app', 'net', 'org', 'me', 'co', 'tech', 'site', 'xyz', 'info', 'page', 'link']);
const LINK_LABELS = new Set(['linkedin', 'portfolio', 'company', 'personal', 'other', 'blog', 'rss feed']);
const PRESENT_PHRASES = new Set(['atual', 'atualmente', 'presente', 'o momento', 'hoje', 'current', 'present', 'now', 'today']);
const DATE_WORDS = new Set([
  'jan', 'fev', 'feb', 'mar', 'abr', 'apr', 'mai', 'may', 'jun', 'jul', 'ago', 'aug',
  'set', 'sep', 'sept', 'out', 'oct', 'nov', 'dez', 'dec',
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'de', 'of', 'ate', 'to', 'a', 'o', 'momento',
  'atual', 'atualmente', 'presente', 'hoje', 'current', 'present', 'now', 'today',
]);

const trailingParenthesis = (text: string): { before: string; inner: string } | null => {
  const trimmed = text.trimEnd();
  if (!trimmed.endsWith(')')) return null;
  const open = trimmed.lastIndexOf('(');
  if (open < 0) return null;
  return { before: trimmed.slice(0, open).trimEnd(), inner: normalize(trimmed.slice(open + 1, -1)) };
};

const stripDuration = (text: string) => {
  const parenthesis = trailingParenthesis(text);
  if (!parenthesis) return text.trim();
  const { before, inner } = parenthesis;
  const isDuration = DURATION_WORDS.test(inner) || inner === 'menos de um ano' || inner === 'less than a year';
  return isDuration ? before : text.trim();
};

const stripLinkLabel = (text: string) => {
  const parenthesis = trailingParenthesis(text);
  return parenthesis && LINK_LABELS.has(parenthesis.inner) ? parenthesis.before : text.trim();
};

const findEmail = (text: string) =>
  text
    .split(/\s+/)
    .map((word) => trimEndChars(word.replace(/^[<(]+/, ''), '>),.;:'))
    .find((word) => EMAIL_TOKEN.test(word)) ?? '';

const phoneDigits = (text: string) => text.replace(/\D/g, '').length;
const isEmail = (text: string) => findEmail(text) !== '';
const isPhone = (text: string) => {
  const trimmed = text.trim();
  return PHONE_TOKEN.test(trimmed) && phoneDigits(trimmed) >= 8 && phoneDigits(trimmed) <= 15;
};

const looksLikeUrl = (token: string) => {
  if (!token || /\s/.test(token)) return false;
  if (URL_START.test(token)) return true;
  const [host, ...path] = token.split('/');
  if (!DOMAIN.test(host)) return false;
  return path.length > 0 || COMMON_TLDS.has(host.split('.').at(-1)!.toLowerCase());
};

const splitTokens = (text: string) =>
  text
    .split(/[|•·]/)
    .flatMap((part) => part.split(/ {3,}/))
    .map((token) => token.trim())
    .filter(Boolean);

const stripUrl = (url: string) => trimEndChars(url.replace(/^https?:\/\//i, '').replace(/^www\./i, ''), '/').toLowerCase();
const stripBullet = (text: string) => text.replace(BULLET, '').trim();
const isPresent = (text: string) => PRESENT_PHRASES.has(normalize(text));

const isPlace = (text: string) => {
  if (text.length > 60 || BULLET.test(text) || /[.;:!?]$/.test(text)) return false;
  return PLACE_WORDS.test(normalize(text)) || /(?:,| -) [A-Z]{2}$/.test(text);
};

export const isDateText = (text: string): boolean => {
  const normalized = normalize(stripDuration(text));
  if (!normalized || normalized.length > 45) return false;
  const words = normalized.split(/[\s/.,()–—-]+/).filter(Boolean);
  const hasYear = words.some((word) => /^(?:19|20)\d{2}$/.test(word));
  const hasPresent = words.some((word) => PRESENT_PHRASES.has(word)) || normalized.includes('o momento');
  if (!hasYear && !hasPresent) return false;
  return words.every((word) => /^\d+$/.test(word) || DATE_WORDS.has(word));
};

export const parseDateRange = (text: string): DateRange => {
  const cleaned = stripDuration(text).replace(/\s+/g, ' ').replace(/^\(|\)$/g, '');
  if (/^[–—-]/.test(cleaned)) {
    const end = cleaned.slice(1).trim();
    return { start: '', end: isPresent(end) ? '' : end };
  }
  const [start, ...rest] = cleaned.split(RANGE_SEPARATOR);
  const end = rest.join(' ').trim();
  return { start: start.trim(), end: isPresent(end) ? '' : end };
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

const knownHeading = (line: PdfLine) => (line.text.length <= 60 ? HEADING_BY_TEXT.get(normalize(line.text)) : undefined);

const looksLikeUnknownHeading = (line: PdfLine, body: number, headingSize: number) => {
  const letters = line.text.replace(/[^\p{L}]/gu, '');
  return (
    letters.length >= 3 &&
    line.text === line.text.toUpperCase() &&
    line.text.split(/\s+/).length <= 6 &&
    !/\d|@/.test(line.text) &&
    (line.fontSize > body || line.bold) &&
    line.fontSize >= headingSize - 0.5
  );
};

const splitSections = (lines: PdfLine[], body: number): { header: PdfLine[]; sections: Section[] } => {
  const header: PdfLine[] = [];
  const sections: Section[] = [];
  const headingSizes = lines
    .filter((line) => knownHeading(line))
    .map((line) => line.fontSize)
    .sort((a, b) => a - b);
  const headingSize = headingSizes.length ? headingSizes[Math.floor(headingSizes.length / 2)] : 0;
  for (const line of lines) {
    const known = knownHeading(line);
    if (known || (sections.length > 0 && looksLikeUnknownHeading(line, body, headingSize))) {
      sections.push({ key: known ?? 'other', heading: line.text, lines: [] });
    } else if (sections.length === 0) {
      header.push(line);
    } else {
      sections.at(-1)!.lines.push(line);
    }
  }
  return { header, sections };
};

type ColumnRight = (line: PdfLine) => number;

const columnRightOf = (lines: PdfLine[]): ColumnRight => {
  const cache = new Map<number, number>();
  return (line) => {
    const key = Math.round(line.x);
    if (!cache.has(key)) {
      cache.set(key, Math.max(...lines.filter((other) => Math.abs(other.x - line.x) <= 3).map((other) => other.right)));
    }
    return cache.get(key)!;
  };
};

const charWidthOf = (line: PdfLine) => (line.right - line.x) / Math.max(line.text.length, 1);

const wrapsInto = (previous: PdfLine, line: PdfLine, columnRight: ColumnRight) => {
  const charWidth = Math.max(charWidthOf(line), charWidthOf(previous));
  const firstWord = line.text.split(/\s+/)[0];
  const lowercase = /^\p{Ll}/u.test(line.text);
  const right = columnRight(previous);
  const longLine = previous.right - previous.x >= (right - previous.x) * 0.6;
  if (lowercase && longLine && !/[.!?:;]$/.test(previous.text)) return true;
  return previous.right + charWidth * firstWord.length > right - charWidth;
};

const MAX_HANGING_INDENT_CHARS = 4;

const startsAlignedWith = (previous: PdfLine, line: PdfLine) => {
  if (Math.abs(previous.x - line.x) <= 3) return true;
  const indent = line.x - previous.x;
  return BULLET.test(previous.text) && indent > 0 && indent <= charWidthOf(previous) * MAX_HANGING_INDENT_CHARS;
};

const toParagraphs = (lines: PdfLine[], columnRight: ColumnRight): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  let previous: PdfLine | null = null;
  for (const line of lines) {
    const gap = previous ? previous.y - line.y : 0;
    const closeEnough =
      previous !== null &&
      (previous.page === line.page ? gap > 0 && gap <= line.fontSize * 1.8 : !/[.!?:]$/.test(previous.text));
    const continues =
      previous !== null &&
      closeEnough &&
      startsAlignedWith(previous, line) &&
      previous.fontSize === line.fontSize &&
      previous.bold === line.bold &&
      previous.italic === line.italic &&
      !BULLET.test(line.text) &&
      wrapsInto(previous, line, columnRight);
    if (continues) {
      const paragraph = paragraphs.at(-1)!;
      paragraph.text += /[-/]$/.test(paragraph.text) ? line.text : ` ${line.text}`;
      paragraph.lines.push(line);
    } else {
      paragraphs.push({ text: line.text, fontSize: line.fontSize, bold: line.bold, italic: line.italic, lines: [line] });
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
      else if (entries.length > 0) entries.at(-1)!.push(paragraph);
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
    const maxHeader = inline?.text ? 1 : 2;
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
  if (date && rest.length > 1 && isPlace(rest[0].text)) rest.shift();

  return { title: stripBullet(title), subtitle, date, body: rest };
};

const bodyLines = (body: Paragraph[]) => body.map((p) => stripBullet(p.text)).filter(Boolean);

const listItems = (paragraphs: Paragraph[]) => paragraphs.flatMap((p) => splitTokens(stripBullet(p.text)));

interface ContactFields {
  email: string;
  phone: string;
  urls: string[];
  leftovers: { text: string; line: PdfLine }[];
}

const siteLinkTexts = (links: PdfLink[]) =>
  links.filter((link) => /^https?:/i.test(link.url)).map((link) => link.text).filter(Boolean);

const isLinkRow = (line: PdfLine, linkTexts: string[]) => {
  if (linkTexts.length === 0) return false;
  let rest = line.text;
  for (const linkText of linkTexts) rest = rest.split(linkText).join(' ');
  return !rest.trim();
};

const addContactToken = (fields: ContactFields, token: string, line: PdfLine) => {
  const email = findEmail(token);
  const url = stripLinkLabel(token);
  if (email) fields.email ||= email;
  else if (isPhone(token)) fields.phone ||= token;
  else if (looksLikeUrl(url)) fields.urls.push(url);
  else fields.leftovers.push({ text: token, line });
};

const readContactLines = (lines: PdfLine[], links: PdfLink[]): ContactFields => {
  const fields: ContactFields = { email: '', phone: '', urls: [], leftovers: [] };
  const linkTexts = siteLinkTexts(links);
  for (const line of lines.filter((candidate) => !isLinkRow(candidate, linkTexts))) {
    const tokens = splitTokens(line.text).map((raw) => raw.replace(LABEL, '').trim());
    for (const token of tokens.filter(Boolean)) addContactToken(fields, token, line);
  }
  return fields;
};

const cleanProfileUrl = (url: string) => {
  let decoded = url;
  try {
    decoded = decodeURI(url);
  } catch {
    decoded = url;
  }
  const queryStart = decoded.search(/[?#]/);
  return /linkedin\.com/i.test(decoded) && queryStart >= 0 ? decoded.slice(0, queryStart) : decoded;
};

const mergeLinks = (links: PdfLink[]): PdfLink[] => {
  const merged: PdfLink[] = [];
  for (const link of links) {
    const previous = merged.at(-1);
    if (previous?.url === link.url) {
      previous.text = previous.text.endsWith('-') ? previous.text + link.text : `${previous.text} ${link.text}`.trim();
    } else {
      merged.push({ ...link });
    }
  }
  return merged.map((link) => ({ url: cleanProfileUrl(link.url), text: stripLinkLabel(link.text) }));
};

const readProfileLinks = (links: PdfLink[], urlTokens: string[], cv: CVData) => {
  const candidates: PdfLink[] = [
    ...mergeLinks(links).filter((link) => /^https?:/i.test(link.url)),
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

type EntryKey = 'experience' | 'education' | 'projects' | 'references';

const addEntry = (key: EntryKey, entry: Entry, cv: CVData, unmatched: string[], newId: () => string) => {
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
        .flatMap((line) => line.split(','))
        .map((topic) => topic.trim())
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
    const email = all.map(findEmail).find(Boolean) ?? '';
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

const extractNameBlock = (lines: PdfLine[], body: number): { flow: PdfLine[]; nameBlock: PdfLine[] } => {
  const firstHeading = lines.findIndex((line) => knownHeading(line));
  const firstPage = lines.filter((line) => line.page === lines[0].page && !knownHeading(line));
  if (firstHeading <= 0 && firstPage.length === 0) return { flow: lines, nameBlock: [] };
  const biggest = firstPage.reduce((best, line) => (line.fontSize > best.fontSize ? line : best), firstPage[0]);
  const index = lines.indexOf(biggest);
  if (firstHeading === -1 || index < firstHeading || biggest.fontSize < body * 1.4) return { flow: lines, nameBlock: [] };
  let end = index + 1;
  while (end < lines.length && !knownHeading(lines[end])) end++;
  return { flow: [...lines.slice(0, index), ...lines.slice(end)], nameBlock: lines.slice(index, end) };
};

const isContactLine = (line: PdfLine, links: PdfLink[]) => {
  if (isLinkRow(line, siteLinkTexts(links))) return true;
  return splitTokens(line.text)
    .map((token) => stripLinkLabel(token.replace(LABEL, '')))
    .some((token) => isEmail(token) || isPhone(token) || looksLikeUrl(token));
};

const readHeader = (
  header: PdfLine[],
  sections: Section[],
  links: PdfLink[],
  columnRight: ColumnRight,
  cv: CVData,
  unmatched: string[],
) => {
  const nameLine = header.reduce<PdfLine | null>(
    (best, line) => (!isEmail(line.text) && !isPhone(line.text) && (!best || line.fontSize > best.fontSize) ? line : best),
    null,
  );
  if (nameLine) cv.fullName = nameLine.text;

  const nameIndex = nameLine ? header.indexOf(nameLine) : -1;
  const contactLines = header.slice(0, Math.max(nameIndex, 0));
  const places: string[] = [];
  toParagraphs(header.slice(nameIndex + 1), columnRight).forEach((paragraph, index) => {
    if (paragraph.lines.some((line) => isContactLine(line, links))) contactLines.push(...paragraph.lines);
    else if (index === 0) cv.jobTitle = paragraph.text;
    else places.push(paragraph.text);
  });

  const contact = readContactLines(
    [...contactLines, ...sections.filter((section) => section.key === 'contact').flatMap((section) => section.lines)],
    links,
  );
  cv.email = contact.email;
  cv.phone = contact.phone;
  readProfileLinks(links, contact.urls, cv);

  const leftovers = [...places, ...contact.leftovers.map((leftover) => leftover.text)];
  for (const text of leftovers) {
    if (!cv.address) cv.address = text;
    else if (!normalize(cv.address).includes(normalize(text))) unmatched.push(text);
  }
};

const withCompanies = (groups: Paragraph[][], body: number): { group: Paragraph[]; company: string }[] => {
  const sizes = new Set(groups.map((group) => group[0].fontSize));
  if (sizes.size < 2 || groups.some((group) => group[0].fontSize <= body)) return groups.map((group) => ({ group, company: '' }));
  const companySize = Math.max(...sizes);
  const result: { group: Paragraph[]; company: string }[] = [];
  let company = '';
  for (const group of groups) {
    const isCompany = group[0].fontSize === companySize;
    const hasDate = group.some((p) => isDateText(p.text) || splitTrailingDate(p.text));
    if (isCompany && !hasDate) {
      company = group[0].text;
      continue;
    }
    result.push({ group, company: isCompany ? '' : company });
  }
  return result;
};

const readEntries = (
  key: EntryKey,
  paragraphs: Paragraph[],
  body: number,
  cv: CVData,
  unmatched: string[],
  newId: () => string,
) => {
  const { entries, leading } = groupEntries(paragraphs, body);
  unmatched.push(...leading.map((p) => p.text));
  const groups = key === 'experience' ? withCompanies(entries, body) : entries.map((group) => ({ group, company: '' }));
  for (const { group, company } of groups) {
    const entry = parseEntry(group);
    if (company && !entry.subtitle) entry.subtitle = company;
    addEntry(key, entry, cv, unmatched, newId);
  }
};

const ENTRY_KEYS = new Set<SectionKey>(['experience', 'education', 'projects', 'references']);

const readSection = (
  section: Section,
  paragraphs: Paragraph[],
  body: number,
  cv: CVData,
  unmatched: string[],
  newId: () => string,
) => {
  const { key } = section;
  if (ENTRY_KEYS.has(key)) {
    readEntries(key as EntryKey, paragraphs, body, cv, unmatched, newId);
  } else if (key === 'objective') {
    cv.objective = appendText(cv.objective, paragraphs.map((p) => p.text));
  } else if (key === 'skills' || key === 'languages' || key === 'softSkills') {
    cv[key] = appendText(cv[key], listItems(paragraphs));
  } else if (key === 'interpersonalSkills') {
    cv.interpersonalSkills = appendText(cv.interpersonalSkills, bodyLines(paragraphs));
  } else {
    unmatched.push(section.heading, ...paragraphs.map((p) => p.text));
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

  const textLines = lines.filter((line) => !PAGE_FOOTER.test(line.text));
  const body = bodyFontSize(textLines);
  const columnRight = columnRightOf(textLines);
  const { flow, nameBlock } = extractNameBlock(textLines, body);
  const { header, sections } = splitSections(flow, body);

  readHeader([...nameBlock, ...header], sections, links, columnRight, cv, unmatched);

  for (const section of sections) {
    if (section.key !== 'contact') readSection(section, toParagraphs(section.lines, columnRight), body, cv, unmatched, newId);
  }

  const locale = guessTextLocale(textLines.map((line) => line.text).join('\n'));
  if (locale) cv.locale = locale;

  return { cv, unmatched };
};
