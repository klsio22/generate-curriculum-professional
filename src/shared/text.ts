export const trimStartChars = (text: string, chars: string): string => {
  let start = 0;
  while (start < text.length && chars.includes(text[start])) start++;
  return text.slice(start);
};

export const trimEndChars = (text: string, chars: string): string => {
  let end = text.length;
  while (end > 0 && chars.includes(text[end - 1])) end--;
  return text.slice(0, end);
};

export const trimChars = (text: string, chars: string): string => trimEndChars(trimStartChars(text, chars), chars);
