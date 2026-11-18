import { describe, expect, it } from 'vitest';
import { formatDate, normalizeUrl, wrapAndTruncate } from './textUtils';

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
