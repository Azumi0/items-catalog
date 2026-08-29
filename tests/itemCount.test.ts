import { describe, it, expect } from 'vitest';
import { itemCountLabel, itemCountInstrumental } from '@/lib/itemCount';

describe('Item count label', () => {
  it('uses the singular for exactly one item', () => {
    expect(itemCountLabel(1)).toBe('1 przedmiot');
  });

  it('uses the plural for none and for many', () => {
    expect(itemCountLabel(0)).toBe('0 przedmiotów');
    expect(itemCountLabel(2)).toBe('2 przedmiotów');
    expect(itemCountLabel(14)).toBe('14 przedmiotów');
  });

  it('has an instrumental form for "zniknie razem z N przedmiotami"', () => {
    expect(itemCountInstrumental(1)).toBe('1 przedmiotem');
    expect(itemCountInstrumental(0)).toBe('0 przedmiotami');
    expect(itemCountInstrumental(7)).toBe('7 przedmiotami');
  });
});
