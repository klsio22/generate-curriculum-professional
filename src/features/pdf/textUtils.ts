export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  return dateStr.trim();
};

export const wrapAndTruncate = (
  text?: string,
  lineLimit = 30,
  maxLines = 2
): string => {
  if (!text) return '';
  const chunks: string[] = [];
  for (let i = 0; i < maxLines; i++) {
    const start = i * lineLimit;
    const end = start + lineLimit;
    if (start >= text.length) break;
    chunks.push(text.slice(start, end));
  }
  const used = chunks.join('');
  const overflow = text.length > used.length;

  if (!overflow) return chunks.join('\n');
  const last = chunks.at(-1) || '';
  chunks[chunks.length - 1] = last.slice(0, Math.max(0, lineLimit - 3)) + '...';
  return chunks.join('\n');
};


export const normalizeUrl = (u?: string) => {
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};
export type DescriptionBlock = { kind: 'subheading' | 'item' | 'paragraph'; text: string; line: number };

const LEADING_MARKER = /^[•●▪◦‣∙·*-]\s+/;

export const parseDescription = (text?: string): DescriptionBlock[] => {
  const blocks: DescriptionBlock[] = [];
  let insideSubheading = false;
  (text ?? '').split('\n').forEach((raw, line) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      insideSubheading = false;
      return;
    }
    if (trimmed.endsWith(':')) {
      blocks.push({ kind: 'subheading', text: trimmed, line });
      insideSubheading = true;
      return;
    }
    if (insideSubheading) {
      blocks.push({ kind: 'item', text: trimmed.replace(LEADING_MARKER, ''), line });
      return;
    }
    blocks.push({ kind: 'paragraph', text: trimmed, line });
  });
  return blocks;
};
