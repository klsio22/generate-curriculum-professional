import type { ResumeContent } from '@/features/history/history';
import { MAX_REFINE_TURNS } from './prompts';

export const CHAT_KEY = 'cv-chat';
export const MAX_MESSAGES_PER_CV = 40;

export type ProposalStatus = 'pending' | 'applied' | 'discarded';

export interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  request?: string;
  proposal?: { cv: ResumeContent; base: ResumeContent; status: ProposalStatus };
  facts?: string[];
  discardedItems?: number;
}

export interface ChatThread {
  updatedAt: number;
  items: ChatItem[];
}

export type ChatStore = Record<string, ChatThread>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const STATUSES = new Set<ProposalStatus>(['pending', 'applied', 'discarded']);

const isContent = (value: unknown): value is ResumeContent =>
  isRecord(value) && Array.isArray(value.experience) && Array.isArray(value.education);

const isProposal = (value: unknown): value is ChatItem['proposal'] =>
  isRecord(value) && isContent(value.cv) && isContent(value.base) && STATUSES.has(value.status as ProposalStatus);

const isItem = (value: unknown): value is ChatItem =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  (value.role === 'user' || value.role === 'assistant') &&
  typeof value.text === 'string' &&
  (value.proposal === undefined || isProposal(value.proposal));

const sanitizeItem = (item: ChatItem): ChatItem => ({
  ...item,
  facts: Array.isArray(item.facts) ? item.facts.filter((fact) => typeof fact === 'string') : undefined,
  discardedItems: typeof item.discardedItems === 'number' ? item.discardedItems : undefined,
});

export const sanitizeChats = (raw: unknown): ChatStore => {
  if (!isRecord(raw)) return {};
  const store: ChatStore = {};
  for (const [cvId, thread] of Object.entries(raw)) {
    if (!isRecord(thread) || !Array.isArray(thread.items)) continue;
    const items = thread.items.filter(isItem).map(sanitizeItem);
    if (items.length > 0) store[cvId] = { updatedAt: Number(thread.updatedAt) || 0, items };
  }
  return store;
};

export const trimItems = (items: ChatItem[]): ChatItem[] => items.slice(-MAX_MESSAGES_PER_CV);

export const itemsToSend = (items: ChatItem[]): ChatItem[] => {
  const recent = items.slice(-MAX_REFINE_TURNS);
  const firstUser = recent.findIndex((item) => item.role === 'user');
  return firstUser === -1 ? [] : recent.slice(firstUser);
};

export const withThread = (store: ChatStore, cvId: string, items: ChatItem[], now = Date.now()): ChatStore => {
  const rest = Object.fromEntries(Object.entries(store).filter(([id]) => id !== cvId));
  return items.length === 0 ? rest : { ...rest, [cvId]: { updatedAt: now, items: trimItems(items) } };
};

export const keepThreadsFor = (store: ChatStore, cvIds: Set<string>): ChatStore =>
  Object.fromEntries(Object.entries(store).filter(([cvId]) => cvIds.has(cvId)));

export const fitChatsToStorage = (store: ChatStore, write: (json: string) => void): ChatStore => {
  let kept = Object.entries(store).sort(([, a], [, b]) => b.updatedAt - a.updatedAt);
  while (kept.length > 0) {
    const next = Object.fromEntries(kept);
    try {
      write(JSON.stringify(next));
      return next;
    } catch {
      kept = kept.slice(0, -1);
    }
  }
  write('{}');
  return {};
};

const readStore = (): ChatStore => {
  try {
    return sanitizeChats(JSON.parse(localStorage.getItem(CHAT_KEY) ?? '{}'));
  } catch {
    return {};
  }
};

const writeStore = (store: ChatStore) =>
  fitChatsToStorage(store, (json) => localStorage.setItem(CHAT_KEY, json));

export const loadChat = (cvId: string): ChatItem[] => readStore()[cvId]?.items ?? [];

export const saveChat = (cvId: string, items: ChatItem[]) => writeStore(withThread(readStore(), cvId, items));

export const removeChatFor = (cvId: string) => writeStore(withThread(readStore(), cvId, []));

export const keepChatsFor = (cvIds: Set<string>) => writeStore(keepThreadsFor(readStore(), cvIds));

export const clearChats = () => localStorage.removeItem(CHAT_KEY);
