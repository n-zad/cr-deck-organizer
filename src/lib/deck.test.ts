import { describe, expect, it } from 'vitest';
import {
  averageElixir,
  createDeck,
  firstEmptySlot,
  formatElixir,
  isCompleteDeck,
  normalizeEvolutionSlots,
  toggleEvolution,
} from './deck.ts';
import { DECK_SIZE, MAX_EVOLUTIONS, type CatalogCard } from './types.ts';

function card(partial: Partial<CatalogCard> & Pick<CatalogCard, 'id' | 'name'>): CatalogCard {
  return {
    elixir: 3,
    rarity: 'common',
    type: 'troop',
    hasEvolution: false,
    image: `cards/${partial.id}.png`,
    ...partial,
  };
}

describe('deck helpers', () => {
  it('creates an eight-slot empty deck', () => {
    const deck = createDeck({ name: '  Log Bait  ' });
    expect(deck.name).toBe('Log Bait');
    expect(deck.cardIds).toHaveLength(DECK_SIZE);
    expect(deck.cardIds.every((id) => id == null)).toBe(true);
    expect(deck.evolutionSlots).toEqual(Array.from({ length: DECK_SIZE }, () => false));
  });

  it('reports completeness only for eight unique cards', () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(isCompleteDeck(ids)).toBe(true);
    expect(isCompleteDeck([1, 2, 3, 4, 5, 6, 7, null])).toBe(false);
    expect(isCompleteDeck([1, 2, 3, 4, 5, 6, 7, 1])).toBe(false);
  });

  it('finds the first empty slot', () => {
    expect(firstEmptySlot([1, 2, null, 4, null, null, null, null])).toBe(2);
    expect(firstEmptySlot([1, 2, 3, 4, 5, 6, 7, 8])).toBeNull();
  });

  it('caps evolutions at the game limit', () => {
    const capped = normalizeEvolutionSlots(
      [true, true, true, false, false, false, false, false],
      [1, 2, 3, 4, 5, 6, 7, 8],
    );
    expect(capped.filter(Boolean)).toHaveLength(MAX_EVOLUTIONS);
    expect(capped[0]).toBe(true);
    expect(capped[1]).toBe(true);
    expect(capped[2]).toBe(false);
  });

  it('toggles evolution only for eligible cards up to the cap', () => {
    let slots = toggleEvolution(Array.from({ length: 8 }, () => false), 0, true);
    slots = toggleEvolution(slots, 1, true);
    const blocked = toggleEvolution(slots, 2, true);
    expect(blocked).toEqual(slots);
    const cleared = toggleEvolution(slots, 0, true);
    expect(cleared[0]).toBe(false);
    expect(toggleEvolution(slots, 0, false)[0]).toBe(true);
  });

  it('averages elixir and treats unknown costs as 1', () => {
    const cards = [
      card({ id: 1, name: 'Knight', elixir: 3 }),
      card({ id: 2, name: 'The Log', elixir: 2 }),
      card({ id: 3, name: 'Mirror', elixir: null }),
    ];
    expect(averageElixir(cards)).toBe(2);
    expect(averageElixir([])).toBeNull();
    expect(formatElixir(3)).toBe('3');
    expect(formatElixir(3.1)).toBe('3.1');
    expect(formatElixir(null)).toBe('—');
  });
});
