import { describe, expect, it } from 'vitest';
import { moveCVInList } from './useCVStorage';

const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const ids = (items: { id: string }[]) => items.map((item) => item.id).join('');

describe('moveCVInList', () => {
  it('moves an item down and up', () => {
    expect(ids(moveCVInList(list, 'a', 2))).toBe('bcad');
    expect(ids(moveCVInList(list, 'd', 0))).toBe('dabc');
  });

  it('keeps the same list when nothing changes', () => {
    expect(moveCVInList(list, 'b', 1)).toBe(list);
    expect(moveCVInList(list, 'x', 0)).toBe(list);
  });

  it('clamps positions outside the list', () => {
    expect(ids(moveCVInList(list, 'b', 99))).toBe('acdb');
    expect(ids(moveCVInList(list, 'c', -5))).toBe('cabd');
  });
});
