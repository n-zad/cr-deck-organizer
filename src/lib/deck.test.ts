import { describe, expect, it } from 'vitest';
import {
  averageElixir,
  cardFrame,
  createDeck,
  firstEmptySlot,
  formatElixir,
  isCompleteDeck,
  isLegalFormSlot,
  normalizeEvolutionSlots,
  shareBlockReason,
  slotRole,
  swapDeckSlots,
  toggleEvolution,
  toggleHero,
} from './deck.ts';
import { DECK_SIZE, MAX_EVOLUTIONS, type CatalogCard } from './types.ts';

function card(partial: Partial<CatalogCard> & Pick<CatalogCard, 'id' | 'name'>): CatalogCard {
  return {
    elixir: 3,
    rarity: 'common',
    type: 'troop',
    hasEvolution: false,
    hasHero: false,
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
    expect(deck.heroSlots).toEqual(Array.from({ length: DECK_SIZE }, () => false));
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

  it('maps the first three slots and treats form frames independently of location', () => {
    expect(slotRole(0)).toBe('evo');
    expect(slotRole(1)).toBe('hero');
    expect(slotRole(2)).toBe('wild');
    expect(cardFrame(true, true, true)).toBe('evo');
    expect(cardFrame(false, true, true)).toBe('hero');
    expect(cardFrame(false, false, true)).toBe('champion');
    expect(isLegalFormSlot(0, 'evo')).toBe(true);
    expect(isLegalFormSlot(3, 'evo')).toBe(false);
    expect(isLegalFormSlot(1, 'hero')).toBe(true);
    expect(isLegalFormSlot(0, 'hero')).toBe(false);
    expect(isLegalFormSlot(2, 'champion')).toBe(true);
    expect(isLegalFormSlot(4, 'champion')).toBe(false);
  });

  it('toggles hero forms and swaps cards with their flags', () => {
    let heroSlots = toggleHero(Array.from({ length: 8 }, () => false), 1, true);
    expect(heroSlots[1]).toBe(true);
    heroSlots = toggleHero(heroSlots, 1, true);
    expect(heroSlots[1]).toBe(false);

    const deck = createDeck({
      cardIds: [1, 2, null, null, null, null, null, null],
      evolutionSlots: [true, false, false, false, false, false, false, false],
      heroSlots: [false, true, false, false, false, false, false, false],
    });
    const swapped = swapDeckSlots(deck, 0, 3);
    expect(swapped.cardIds[0]).toBeNull();
    expect(swapped.cardIds[3]).toBe(1);
    expect(swapped.evolutionSlots[0]).toBe(false);
    expect(swapped.evolutionSlots[3]).toBe(true);
    expect(swapped.heroSlots[1]).toBe(true);
  });

  it('blocks share links for incomplete decks and misplaced champions', () => {
    const incomplete = createDeck({
      cardIds: [26000000, 26000001, null, null, null, null, null, null],
    });
    expect(shareBlockReason(incomplete)).toMatch(/full 8-card deck/i);

    const legal = createDeck({
      cardIds: [26000000, 26000072, 26000001, 26000010, 26000013, 26000031, 26000084, 26000030],
    });
    expect(shareBlockReason(legal)).toBeNull();

    const illegal = createDeck({
      cardIds: [26000000, 26000001, 26000010, 26000072, 26000013, 26000031, 26000084, 26000030],
    });
    expect(shareBlockReason(illegal)).toMatch(/Hero or Wild/i);
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
