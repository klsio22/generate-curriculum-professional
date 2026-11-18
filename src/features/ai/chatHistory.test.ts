import { describe, expect, it } from 'vitest';
import type { CVData } from '@/types/cv';
import { contentOf } from '@/features/history/history';
import {
  fitChatsToStorage,
  itemsToSend,
  keepThreadsFor,
  MAX_MESSAGES_PER_CV,
  sanitizeChats,
  withThread,
  type ChatItem,
  type ChatStore,
} from './chatHistory';
import { MAX_REFINE_TURNS } from './prompts';

const cv: CVData = {
  fullName: 'Ana',
  jobTitle: 'Dev',
  address: 'SP',
  phone: '1',
  email: 'ana@example.com',
  linkedin: 'in/ana',
  objective: 'Resumo',
  skills: 'React',
  education: [],
  experience: [],
  locale: 'pt-BR',
};

const message = (id: string, role: ChatItem['role'] = 'user'): ChatItem => ({ id, role, text: id });

const conversation = (count: number): ChatItem[] =>
  Array.from({ length: count }, (_, index) => message(`m${index}`, index % 2 === 0 ? 'user' : 'assistant'));

describe('withThread', () => {
  it('stores the conversation of one resume and keeps the others', () => {
    const store = withThread({ b: { updatedAt: 1, items: [message('x')] } }, 'a', [message('y')], 5);
    expect(store).toEqual({ b: { updatedAt: 1, items: [message('x')] }, a: { updatedAt: 5, items: [message('y')] } });
  });

  it('removes the thread when the conversation is empty', () => {
    expect(withThread({ a: { updatedAt: 1, items: [message('x')] } }, 'a', [])).toEqual({});
  });

  it('keeps only the latest messages', () => {
    const items = withThread({}, 'a', conversation(MAX_MESSAGES_PER_CV + 5)).a.items;
    expect(items).toHaveLength(MAX_MESSAGES_PER_CV);
    expect(items[0].id).toBe('m5');
  });
});

describe('itemsToSend', () => {
  it('sends the latest turns starting with a user message', () => {
    const sent = itemsToSend(conversation(MAX_REFINE_TURNS + 3));
    expect(sent.length).toBeLessThanOrEqual(MAX_REFINE_TURNS);
    expect(sent[0].role).toBe('user');
    expect(sent.at(-1)?.id).toBe(`m${MAX_REFINE_TURNS + 2}`);
  });

  it('sends nothing without a user message', () => {
    expect(itemsToSend([message('a', 'assistant')])).toEqual([]);
  });
});

describe('keepThreadsFor', () => {
  it('drops conversations of resumes that no longer exist', () => {
    const store: ChatStore = { a: { updatedAt: 1, items: [message('x')] }, b: { updatedAt: 2, items: [message('y')] } };
    expect(Object.keys(keepThreadsFor(store, new Set(['b'])))).toEqual(['b']);
  });
});

describe('sanitizeChats', () => {
  it('keeps valid messages and proposals', () => {
    const proposal = { cv: contentOf(cv), base: contentOf(cv), status: 'applied' };
    const raw = { a: { updatedAt: 3, items: [message('x'), { ...message('y', 'assistant'), proposal }] } };
    expect(sanitizeChats(JSON.parse(JSON.stringify(raw))).a.items).toHaveLength(2);
  });

  it('ignores broken data', () => {
    const raw = {
      a: { updatedAt: 1, items: [{ id: 1 }, { ...message('y', 'assistant'), proposal: { status: 'x' } }] },
      b: 'oops',
      c: { items: [message('z')] },
    };
    expect(sanitizeChats(raw)).toEqual({ c: { updatedAt: 0, items: [{ ...message('z'), facts: undefined, discardedItems: undefined }] } });
    expect(sanitizeChats('nope')).toEqual({});
  });
});

describe('fitChatsToStorage', () => {
  it('drops the oldest conversations until it fits', () => {
    const store: ChatStore = {
      old: { updatedAt: 1, items: [message('x')] },
      recent: { updatedAt: 9, items: [message('y')] },
    };
    const written: string[] = [];
    const kept = fitChatsToStorage(store, (json) => {
      if (json.includes('"old"')) throw new Error('quota');
      written.push(json);
    });
    expect(Object.keys(kept)).toEqual(['recent']);
    expect(written).toHaveLength(1);
  });
});
