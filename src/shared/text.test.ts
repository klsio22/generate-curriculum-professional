import { describe, expect, it } from 'vitest';
import { trimChars, trimEndChars, trimStartChars } from './text';

describe('trimming characters', () => {
  it('removes the given characters only from the ends', () => {
    expect(trimEndChars('https://api.example.com/v1///', '/')).toBe('https://api.example.com/v1');
    expect(trimStartChars('__Ana_Souza', '_')).toBe('Ana_Souza');
    expect(trimChars('__Ana_Souza__', '_')).toBe('Ana_Souza');
  });

  it('handles text made only of those characters, and empty text', () => {
    expect(trimChars('____', '_')).toBe('');
    expect(trimEndChars('', '/')).toBe('');
  });
});
