import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export interface PdfLine {
  text: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  page: number;
  x: number;
  right: number;
  y: number;
}

export interface PdfLink {
  url: string;
  text: string;
}

export interface PdfContent {
  lines: PdfLine[];
  links: PdfLink[];
}

interface PositionedText {
  str: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontName: string;
}

interface FontFlags {
  bold?: boolean;
  italic?: boolean;
}

interface LinkAnnotation {
  subtype: string;
  url?: string;
  rect: number[];
}

const readPageText = async (page: PDFPageProxy): Promise<PositionedText[]> => {
  const content = await page.getTextContent();
  return content.items.flatMap((item) => {
    if (!('str' in item) || !item.str) return [];
    const [, , c, d, x, y] = item.transform as number[];
    return [{ str: item.str, x, y, width: item.width, fontSize: Math.round(Math.hypot(c, d) * 10) / 10, fontName: item.fontName }];
  });
};

const readFontFlags = async (page: PDFPageProxy, fontNames: Set<string>): Promise<Map<string, FontFlags>> => {
  const flags = new Map<string, FontFlags>();
  try {
    await page.getOperatorList();
    for (const name of fontNames) {
      const font = page.commonObjs.has(name) ? (page.commonObjs.get(name) as FontFlags | null) : null;
      flags.set(name, { bold: Boolean(font?.bold), italic: Boolean(font?.italic) });
    }
  } catch {
    return flags;
  }
  return flags;
};

const groupIntoLines = (items: PositionedText[], flags: Map<string, FontFlags>, page: number): PdfLine[] => {
  const lines: PdfLine[] = [];
  let current: (PdfLine & { boldChars: number; italicChars: number; chars: number }) | null = null;

  const flush = () => {
    if (!current) return;
    const text = current.text.replace(/\s+/g, ' ').trim();
    if (text) {
      lines.push({
        text,
        fontSize: current.fontSize,
        bold: current.boldChars > current.chars / 2,
        italic: current.italicChars > current.chars / 2,
        page,
        x: current.x,
        right: current.right,
        y: current.y,
      });
    }
    current = null;
  };

  for (const item of items) {
    const sameLine = current && Math.abs(current.y - item.y) <= Math.max(current.fontSize, item.fontSize) * 0.35;
    if (!sameLine) {
      flush();
      current = { text: '', fontSize: 0, bold: false, italic: false, page, x: item.x, right: item.x, y: item.y, boldChars: 0, italicChars: 0, chars: 0 };
    }
    const line = current!;
    const gap = item.x - line.right;
    const needsSpace = line.text && !/\s$/.test(line.text) && !/^\s/.test(item.str) && gap > item.fontSize * 0.15;
    line.text += (needsSpace ? ' ' : '') + item.str;
    line.x = Math.min(line.x, item.x);
    line.right = Math.max(line.right, item.x + item.width);

    const visible = item.str.trim().length;
    if (visible > 0) {
      const font = flags.get(item.fontName);
      line.fontSize = Math.max(line.fontSize, item.fontSize);
      line.chars += visible;
      if (font?.bold) line.boldChars += visible;
      if (font?.italic) line.italicChars += visible;
    }
  }
  flush();
  return lines;
};

const readLinks = async (page: PDFPageProxy, items: PositionedText[]): Promise<PdfLink[]> => {
  const annotations = (await page.getAnnotations()) as LinkAnnotation[];
  return annotations
    .filter((annotation) => annotation.subtype === 'Link' && typeof annotation.url === 'string')
    .map((annotation) => {
      const [left, bottom, right, top] = annotation.rect;
      const text = items
        .filter((item) => {
          const center = item.x + item.width / 2;
          return item.str.trim() && center >= left && center <= right && item.y >= bottom - 2 && item.y <= top + 2;
        })
        .map((item) => item.str.trim())
        .join(' ');
      return { url: annotation.url as string, text };
    });
};

export const extractPdfContent = async (doc: PDFDocumentProxy): Promise<PdfContent> => {
  const lines: PdfLine[] = [];
  const links: PdfLink[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const items = await readPageText(page);
    const flags = await readFontFlags(page, new Set(items.map((item) => item.fontName)));
    lines.push(...groupIntoLines(items, flags, pageNumber));
    links.push(...(await readLinks(page, items)));
    page.cleanup();
  }
  return { lines, links };
};
