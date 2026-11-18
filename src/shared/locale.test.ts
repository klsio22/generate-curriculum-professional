import { describe, expect, it } from 'vitest';
import {
  contentLocaleOf,
  detectResumeLocale,
  guessTextLocale,
  isResumeLocale,
  otherLocale,
  toResumeLocale,
} from './locale';

describe('resume locale', () => {
  it('accepts only the supported locales', () => {
    expect(isResumeLocale('pt-BR')).toBe(true);
    expect(isResumeLocale('en')).toBe(true);
    expect(isResumeLocale('fr')).toBe(false);
    expect(isResumeLocale(undefined)).toBe(false);
  });

  it('maps any language code to a resume locale', () => {
    expect(toResumeLocale('pt')).toBe('pt-BR');
    expect(toResumeLocale('PT-br')).toBe('pt-BR');
    expect(toResumeLocale('en-US')).toBe('en');
    expect(toResumeLocale('es')).toBe('en');
  });
});

describe('guessTextLocale', () => {
  it('recognizes Portuguese text', () => {
    expect(
      guessTextLocale('Desenvolvedora de software com experiência em sistemas web e liderança de times para clientes.'),
    ).toBe('pt-BR');
  });

  it('recognizes English text', () => {
    expect(
      guessTextLocale('Software developer with experience in web systems and leading teams for the product.'),
    ).toBe('en');
  });

  it('returns null when it cannot tell', () => {
    expect(guessTextLocale('React TypeScript Node.js')).toBeNull();
    expect(guessTextLocale('')).toBeNull();
  });
});

describe('detectResumeLocale', () => {
  const english = {
    objective: 'Developer with experience in the design of web systems and in leading projects for clients.',
    experience: [],
    education: [],
  };

  it('prefers the locale saved in the resume', () => {
    expect(detectResumeLocale({ ...english, locale: 'pt-BR' }, 'pt-BR')).toBe('pt-BR');
  });

  it('reads the text when the resume has no locale', () => {
    expect(detectResumeLocale(english, 'pt-BR')).toBe('en');
  });

  it('falls back to the interface language when the text says nothing', () => {
    expect(detectResumeLocale({ objective: 'React', experience: [], education: [] }, 'pt-BR')).toBe('pt-BR');
  });

  it('takes the language of the text as the content language, even when another one was chosen', () => {
    expect(contentLocaleOf({ ...english, locale: 'pt-BR' }, 'pt-BR')).toBe('en');
    expect(contentLocaleOf({ objective: 'React', experience: [], education: [], locale: 'en' }, 'pt-BR')).toBe('en');
    expect(contentLocaleOf({ objective: 'React', experience: [], education: [] }, 'pt-BR')).toBe('pt-BR');
  });

  it('switches between the two locales', () => {
    expect(otherLocale('pt-BR')).toBe('en');
    expect(otherLocale('en')).toBe('pt-BR');
  });
});
