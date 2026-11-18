import { describe, expect, it } from 'vitest';
import { formatDate, normalizeUrl, parseDescription, wrapAndTruncate } from './textUtils';

describe('normalizeUrl', () => {
  it('adds https:// when the protocol is missing', () => {
    expect(normalizeUrl('github.com/user')).toBe('https://github.com/user');
  });

  it('keeps an existing protocol', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl()).toBe('');
  });
});

describe('formatDate', () => {
  it('trims the value', () => {
    expect(formatDate('  2024 ')).toBe('2024');
  });
});

describe('wrapAndTruncate', () => {
  it('splits text into lines of the given size', () => {
    expect(wrapAndTruncate('abcdef', 3, 2)).toBe('abc\ndef');
  });

  it('adds an ellipsis when the text does not fit', () => {
    expect(wrapAndTruncate('abcdefghij', 4, 2)).toBe('abcd\ne...');
  });
});

describe('parseDescription', () => {
  const kinds = (text: string) => parseDescription(text).map((block) => [block.kind, block.text]);

  it('turns lines after a subheading into items until an empty line', () => {
    expect(kinds('Responsabilidades:\nCriei telas\nRevisei código\n\nReduzi custos')).toEqual([
      ['subheading', 'Responsabilidades:'],
      ['item', 'Criei telas'],
      ['item', 'Revisei código'],
      ['paragraph', 'Reduzi custos'],
    ]);
  });

  it('keeps lines without a subheading as paragraphs, as typed', () => {
    expect(kinds('- Criei telas\nReduzi custos')).toEqual([
      ['paragraph', '- Criei telas'],
      ['paragraph', 'Reduzi custos'],
    ]);
  });

  it('removes a marker the user typed in an item, so it is not doubled', () => {
    expect(kinds('Feitos:\n• Criei telas\n- Reduzi custos\n* Revisei código')).toEqual([
      ['subheading', 'Feitos:'],
      ['item', 'Criei telas'],
      ['item', 'Reduzi custos'],
      ['item', 'Revisei código'],
    ]);
  });

  it('trims spaces, skips blank lines and keeps the line number', () => {
    expect(parseDescription('  Feitos:  \n   \n  Texto ')).toEqual([
      { kind: 'subheading', text: 'Feitos:', line: 0 },
      { kind: 'paragraph', text: 'Texto', line: 2 },
    ]);
  });

  it('returns nothing for empty text', () => {
    expect(parseDescription('')).toEqual([]);
    expect(parseDescription()).toEqual([]);
  });

  it('keeps a lone subheading-like line inside a paragraph run as a subheading', () => {
    expect(kinds('Texto\nFeitos:\nItem')).toEqual([
      ['paragraph', 'Texto'],
      ['subheading', 'Feitos:'],
      ['item', 'Item'],
    ]);
  });
});
