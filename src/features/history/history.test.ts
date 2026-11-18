import { describe, expect, it } from 'vitest';
import type { CVData } from '@/types/cv';
import {
  addEntry,
  contentOf,
  entriesFor,
  fitToStorage,
  MAX_ENTRIES_PER_CV,
  mergeImportedHistory,
  removeEntriesFor,
  sanitizeHistory,
  type HistoryEntry,
} from './history';

const cv: CVData = {
  fullName: 'Ana',
  jobTitle: 'Dev',
  address: 'SP',
  phone: '1',
  email: 'ana@example.com',
  linkedin: 'in/ana',
  objective: 'Resumo',
  skills: 'React',
  education: [{ id: 'd1', course: 'CC', institution: 'USP', startDate: '2015', endDate: '2019' }],
  experience: [{ id: 'e1', role: 'Dev', company: 'Alfa', startDate: '2020', endDate: 'Atual', description: 'Telas' }],
  locale: 'pt-BR',
};

const entry = (id: string, cvId: string, createdAt: number): HistoryEntry => ({
  id,
  cvId,
  kind: 'tailor',
  createdAt,
  before: contentOf(cv),
  after: contentOf({ ...cv, objective: `Resumo ${id}` }),
  changes: [],
});

describe('contentOf', () => {
  it('keeps only what the AI can change, as a copy', () => {
    const content = contentOf(cv);

    expect(content).not.toHaveProperty('email');
    expect(content).not.toHaveProperty('fullName');
    expect(content.experience).toEqual(cv.experience);
    expect(content.experience).not.toBe(cv.experience);
    expect(content.locale).toBe('pt-BR');
  });
});

describe('addEntry', () => {
  it('keeps the newest entries of each resume up to the limit', () => {
    let entries: HistoryEntry[] = [entry('other', 'b', 0)];
    for (let index = 0; index < MAX_ENTRIES_PER_CV + 3; index += 1) {
      entries = addEntry(entries, entry(`a${index}`, 'a', index));
    }

    const own = entriesFor(entries, 'a');
    expect(own).toHaveLength(MAX_ENTRIES_PER_CV);
    expect(own[0].id).toBe(`a${MAX_ENTRIES_PER_CV + 2}`);
    expect(own.at(-1)?.id).toBe('a3');
    expect(entriesFor(entries, 'b')).toHaveLength(1);
  });
});

describe('removeEntriesFor', () => {
  it('removes only the entries of that resume', () => {
    const entries = [entry('1', 'a', 1), entry('2', 'b', 2)];
    expect(removeEntriesFor(entries, 'a').map((item) => item.id)).toEqual(['2']);
  });
});

describe('sanitizeHistory', () => {
  it('keeps valid entries and drops anything else', () => {
    const valid = entry('1', 'a', 1);
    const raw = [valid, { ...valid, kind: 'other' }, { ...valid, before: null }, 'x', { ...valid, id: '2', changes: 'no' }];

    const result = sanitizeHistory(raw);
    expect(result.map((item) => item.id)).toEqual(['1', '2']);
    expect(result[1].changes).toEqual([]);
    expect(sanitizeHistory({})).toEqual([]);
  });
});

describe('mergeImportedHistory', () => {
  it('moves restored entries to the new resume ids and skips resumes that were not restored', () => {
    let id = 0;
    const merged = mergeImportedHistory(
      [entry('1', 'a', 1)],
      [entry('x', 'old-a', 2), entry('y', 'gone', 3)],
      new Map([['old-a', 'new-a']]),
      () => `new-${++id}`,
    );

    expect(merged.map((item) => [item.id, item.cvId])).toEqual([
      ['1', 'a'],
      ['new-1', 'new-a'],
    ]);
  });
});

describe('fitToStorage', () => {
  it('drops the oldest entries until the history fits', () => {
    const written: string[] = [];
    const write = (json: string) => {
      if (json.length > 2 * JSON.stringify(entry('0', 'a', 0)).length + 10) throw new Error('QuotaExceededError');
      written.push(json);
    };

    const kept = fitToStorage([entry('1', 'a', 1), entry('3', 'a', 3), entry('2', 'a', 2)], write);

    expect(kept.map((item) => item.id)).toEqual(['3', '2']);
    expect(written).toHaveLength(1);
  });
});
