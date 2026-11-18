import { useCallback, useState } from 'react';
import {
  addEntry,
  fitToStorage,
  HISTORY_KEY,
  mergeImportedHistory,
  removeEntriesFor,
  sanitizeHistory,
  type HistoryEntry,
  type HistoryRecord,
} from './history';

const readHistory = (): HistoryEntry[] => {
  try {
    return sanitizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'));
  } catch {
    return [];
  }
};

const persist = (entries: HistoryEntry[]): HistoryEntry[] =>
  fitToStorage(entries, (json) => localStorage.setItem(HISTORY_KEY, json));

export const useCVHistory = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>(readHistory);

  const update = useCallback((change: (current: HistoryEntry[]) => HistoryEntry[]) => {
    setEntries((current) => persist(change(current)));
  }, []);

  const record = useCallback(
    (cvId: string, item: HistoryRecord, model?: string) =>
      update((current) => addEntry(current, { ...item, id: crypto.randomUUID(), cvId, createdAt: Date.now(), model })),
    [update],
  );

  const removeFor = useCallback((cvId: string) => update((current) => removeEntriesFor(current, cvId)), [update]);

  const replaceAll = useCallback((next: HistoryEntry[]) => update(() => next), [update]);

  const mergeImported = useCallback(
    (incoming: HistoryEntry[], cvIdMap: Map<string, string>) =>
      update((current) => mergeImportedHistory(current, incoming, cvIdMap)),
    [update],
  );

  return { entries, record, removeFor, replaceAll, mergeImported };
};
