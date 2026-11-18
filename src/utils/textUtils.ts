// Text utilities used across PDF rendering
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  return dateStr.trim();
};

// Wrap text into multiple lines (by character limit) and truncate after maxLines
// naive chunking by characters to account for long tokens (URLs)
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