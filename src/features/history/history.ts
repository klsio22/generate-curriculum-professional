import type { CVData, ResumeLocale } from '@/types/cv';
import type { JobAnalysis } from '@/features/ai/types';

export const HISTORY_KEY = 'cv-history';
export const MAX_ENTRIES_PER_CV = 20;

export type HistoryKind = 'tailor' | 'translate' | 'restore';

const CONTENT_FIELDS = [
  'jobTitle',
  'objective',
  'skills',
  'softSkills',
  'interpersonalSkills',
  'languages',
  'experience',
  'education',
  'projects',
  'locale',
] as const;

export type ResumeContent = Pick<CVData, (typeof CONTENT_FIELDS)[number]>;

export interface HistoryJob {
  text: string;
  analysis: JobAnalysis;
  coveredBefore: number;
  coveredAfter: number;
  missingKeywords: string[];
  newTerms: string[];
}

export interface HistoryEntry {
  id: string;
  cvId: string;
  kind: HistoryKind;
  createdAt: number;
  model?: string;
  before: ResumeContent;
  after: ResumeContent;
  changes: string[];
  job?: HistoryJob;
  from?: ResumeLocale;
  to?: ResumeLocale;
}

export type HistoryRecord = Omit<HistoryEntry, 'id' | 'cvId' | 'createdAt' | 'model'>;

export const contentOf = (cv: CVData): ResumeContent =>
  structuredClone(Object.fromEntries(CONTENT_FIELDS.map((field) => [field, cv[field]])) as ResumeContent);

const byNewest = (a: HistoryEntry, b: HistoryEntry) => b.createdAt - a.createdAt;

export const addEntry = (entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] => {
  const own = [...entries.filter((item) => item.cvId === entry.cvId), entry].sort(byNewest);
  const kept = new Set(own.slice(0, MAX_ENTRIES_PER_CV).map((item) => item.id));
  return [...entries, entry].filter((item) => item.cvId !== entry.cvId || kept.has(item.id));
};

export const entriesFor = (entries: HistoryEntry[], cvId: string): HistoryEntry[] =>
  entries.filter((entry) => entry.cvId === cvId).sort(byNewest);

export const removeEntriesFor = (entries: HistoryEntry[], cvId: string): HistoryEntry[] =>
  entries.filter((entry) => entry.cvId !== cvId);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const KINDS = new Set<HistoryKind>(['tailor', 'translate', 'restore']);

const isContent = (value: unknown): value is ResumeContent =>
  isRecord(value) && Array.isArray(value.experience) && Array.isArray(value.education);

const isEntry = (value: unknown): value is HistoryEntry =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.cvId === 'string' &&
  KINDS.has(value.kind as HistoryKind) &&
  typeof value.createdAt === 'number' &&
  isContent(value.before) &&
  isContent(value.after);

export const sanitizeHistory = (raw: unknown): HistoryEntry[] =>
  Array.isArray(raw)
    ? raw.filter(isEntry).map((entry) => ({ ...entry, changes: Array.isArray(entry.changes) ? entry.changes : [] }))
    : [];

export const mergeImportedHistory = (
  current: HistoryEntry[],
  incoming: HistoryEntry[],
  cvIdMap: Map<string, string>,
  newId: () => string = () => crypto.randomUUID(),
): HistoryEntry[] => {
  let merged = current;
  for (const entry of incoming) {
    const cvId = cvIdMap.get(entry.cvId);
    if (cvId) merged = addEntry(merged, { ...entry, id: newId(), cvId });
  }
  return merged;
};

export const fitToStorage = (entries: HistoryEntry[], write: (json: string) => void): HistoryEntry[] => {
  let kept = [...entries].sort(byNewest);
  while (kept.length > 0) {
    try {
      write(JSON.stringify(kept));
      return kept;
    } catch {
      kept = kept.slice(0, -1);
    }
  }
  write('[]');
  return kept;
};
