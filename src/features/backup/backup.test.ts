import { describe, expect, it } from 'vitest';
import type { SavedCV } from '@/types/cv';
import type { HistoryEntry } from '@/features/history/history';
import {
  BackupError,
  backupFileName,
  createBackup,
  mergeImportedCVs,
  parseBackupFile,
  restoredIdMap,
  sanitizeImportedCV,
} from './backup';

const cv = (id: string, title = `CV ${id}`): SavedCV => ({
  id,
  title,
  updatedAt: 1,
  fullName: 'Ana',
  jobTitle: 'Dev',
  address: 'SP',
  phone: '1',
  email: 'a@a.com',
  linkedin: 'in/ana',
  objective: 'Obj',
  skills: 'React',
  education: [],
  experience: [],
});

describe('parseBackupFile', () => {
  it('reads the current backup format', () => {
    const file = createBackup([cv('a'), cv('b')], 'b', [], new Date('2026-11-17T10:00:00Z'));
    const result = parseBackupFile(JSON.stringify(file));
    expect(result.cvs.map((c) => c.id)).toEqual(['a', 'b']);
    expect(result.activeId).toBe('b');
    expect(result.exportedAt).toBe('2026-11-17T10:00:00.000Z');
  });

  it('saves and reads the AI history, and reads older backups without it', () => {
    const content = { jobTitle: 'Dev', objective: 'Obj', skills: 'React', experience: [], education: [] };
    const entry: HistoryEntry = { id: 'h1', cvId: 'a', kind: 'translate', createdAt: 1, before: content, after: content, changes: [] };
    const file = createBackup([cv('a')], 'a', [entry, { ...entry, id: 'bad', kind: 'other' } as never]);

    expect(file.version).toBe(2);
    expect(parseBackupFile(JSON.stringify(file)).history.map((item) => item.id)).toEqual(['h1']);
    expect(parseBackupFile(JSON.stringify({ version: 1, cvs: [cv('a')] })).history).toEqual([]);
  });

  it('reads a plain array and skips invalid resumes', () => {
    const result = parseBackupFile(JSON.stringify([cv('a'), { id: 'x' }, 42]));
    expect(result.cvs).toHaveLength(1);
    expect(result.activeId).toBeNull();
    expect(result.exportedAt).toBeNull();
  });

  it('keeps optional fields such as meta', () => {
    const withMeta = { ...cv('a'), meta: { targetJob: 'Dev', createdByAI: true } };
    expect(parseBackupFile(JSON.stringify([withMeta])).cvs[0].meta).toEqual(withMeta.meta);
  });

  it('keeps a supported resume language and drops any other', () => {
    const { cvs } = parseBackupFile(JSON.stringify([{ ...cv('a'), locale: 'en' }, { ...cv('b'), locale: 'fr' }, cv('c')]));
    expect(cvs.map((item) => item.locale)).toEqual(['en', undefined, undefined]);
    expect('locale' in cvs[1]).toBe(false);
  });

  it('explains why a file cannot be used', () => {
    const codeOf = (text: string) => {
      try {
        parseBackupFile(text);
        return null;
      } catch (error) {
        return (error as BackupError).code;
      }
    };
    expect(codeOf('not json')).toBe('not_json');
    expect(codeOf('{"cvs": []}')).toBe('no_resumes');
    expect(codeOf('{"name": "something else"}')).toBe('no_resumes');
  });
});

describe('sanitizeImportedCV', () => {
  it('accepts resumes with empty contact fields (e.g. no address)', () => {
    const result = sanitizeImportedCV({ ...cv('a'), address: '', phone: '', linkedin: undefined });
    expect(result).not.toBeNull();
    expect(result?.address).toBe('');
    expect(result?.linkedin).toBe('');
  });

  it('uses the full name as title when the title is missing', () => {
    expect(sanitizeImportedCV({ ...cv('a'), title: '' })?.title).toBe('Ana');
  });

  it('rejects items that are not resumes', () => {
    expect(sanitizeImportedCV({ ...cv('a'), id: '' })).toBeNull();
    expect(sanitizeImportedCV({ ...cv('a'), title: '', fullName: '' })).toBeNull();
    expect(sanitizeImportedCV({ ...cv('a'), experience: 'x' })).toBeNull();
    expect(sanitizeImportedCV([cv('a')])).toBeNull();
  });

  it('fills missing optional lists', () => {
    const result = sanitizeImportedCV({ ...cv('a'), projects: undefined, references: 'x' });
    expect(result?.projects).toEqual([]);
    expect(result?.references).toEqual([]);
  });
});

describe('mergeImportedCVs', () => {
  it('adds new resumes and renames the ones whose id already exists', () => {
    let n = 0;
    const merged = mergeImportedCVs(
      [cv('a'), cv('b')],
      [cv('b', 'Back-end'), cv('c'), cv('c', 'Duplicate inside file')],
      '(restaurado)',
      () => `new-${++n}`,
    );
    expect(merged.map((c) => [c.id, c.title])).toEqual([
      ['a', 'CV a'],
      ['b', 'CV b'],
      ['new-1', 'Back-end (restaurado)'],
      ['c', 'CV c'],
      ['new-2', 'Duplicate inside file (restaurado)'],
    ]);
  });

  it('keeps the current list when nothing is restored', () => {
    expect(mergeImportedCVs([cv('a')], [], '(r)')).toEqual([cv('a')]);
  });
});

describe('restoredIdMap', () => {
  it('maps each restored resume to the id it got in the list', () => {
    const merged = mergeImportedCVs([cv('a')], [cv('a'), cv('b')], '(restored)', () => 'new');
    expect([...restoredIdMap([cv('a'), cv('b')], merged)]).toEqual([
      ['a', 'new'],
      ['b', 'b'],
    ]);
  });
});

describe('backupFileName', () => {
  it('uses a Portuguese or English name', () => {
    const date = new Date('2026-11-17T12:00:00Z');
    expect(backupFileName('pt-BR', date)).toBe('curriculos-backup-2026-11-17.json');
    expect(backupFileName('en', date)).toBe('resume-backup-2026-11-17.json');
  });
});
