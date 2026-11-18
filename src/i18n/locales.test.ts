import { describe, expect, it } from 'vitest';
import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';

const keysOf = (value: unknown, prefix = ''): string[] =>
  value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => keysOf(child, prefix ? `${prefix}.${key}` : key))
    : [prefix];

describe('translations', () => {
  it('Portuguese and English have the same keys', () => {
    const sorted = (keys: string[]) => [...keys].sort((a, b) => a.localeCompare(b));
    expect(sorted(keysOf(en))).toEqual(sorted(keysOf(ptBR)));
  });

  it('has no empty texts', () => {
    const empty = (obj: unknown) => keysOf(obj).filter((key) => {
      const text = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], obj);
      return typeof text !== 'string' || text.trim() === '';
    });
    expect(empty(ptBR)).toEqual([]);
    expect(empty(en)).toEqual([]);
  });
});
