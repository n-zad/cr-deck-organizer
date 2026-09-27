import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.ts';
import { createDeck } from './deck.ts';
import { sortCards, sortDecks } from './sort.ts';
import type { CatalogCard } from './types.ts';

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

describe('sortCards', () => {
  const cards: CatalogCard[] = [
    card({ id: 2, name: 'Zap', elixir: 2 }),
    card({ id: 3, name: 'Mirror', elixir: null }),
    card({ id: 1, name: 'Knight', elixir: 3 }),
  ];

  it('sorts by elixir, then name, and keeps unknown costs last', () => {
    expect(sortCards(cards, 'elixir').map((item) => item.name)).toEqual([
      'Zap',
      'Knight',
      'Mirror',
    ]);
  });

  it('sorts alphabetically and can reverse either order', () => {
    expect(sortCards(cards, 'name').map((item) => item.name)).toEqual([
      'Knight',
      'Mirror',
      'Zap',
    ]);
    expect(sortCards(cards, 'elixir', true).map((item) => item.name)).toEqual([
      'Mirror',
      'Knight',
      'Zap',
    ]);
  });

  it('sorts by rarity, then elixir, then arena order', () => {
    const names = ['Skeletons', 'Fire Spirit', 'Electro Spirit', 'Ice Spirit'];
    const spirits = catalog.cards.filter((card) => names.includes(card.name));
    expect(sortCards(spirits, 'rarity').map((card) => card.name)).toEqual([
      'Skeletons',
      'Fire Spirit',
      'Electro Spirit',
      'Ice Spirit',
    ]);
  });
});

describe('sortDecks', () => {
  const hog = createDeck({
    name: 'Hog Cycle',
    cardIds: [1, 2, null, null, null, null, null, null],
    updatedAt: '2026-09-02T00:00:00.000Z',
  });
  const golem = createDeck({
    name: 'Golem Beatdown',
    cardIds: [3, 4, null, null, null, null, null, null],
    updatedAt: '2026-09-01T00:00:00.000Z',
  });
  const catalog: Record<number, CatalogCard> = {
    1: card({ id: 1, name: 'Hog Rider', elixir: 4 }),
    2: card({ id: 2, name: 'Ice Spirit', elixir: 1 }),
    3: card({ id: 3, name: 'Golem', elixir: 8 }),
    4: card({ id: 4, name: 'Night Witch', elixir: 4 }),
  };

  function cardsOf(deck: ReturnType<typeof createDeck>) {
    return deck.cardIds.map((id) => (id == null ? undefined : catalog[id]));
  }

  it('defaults to newest first and can reverse to oldest', () => {
    expect(sortDecks([hog, golem], 'updated', false, cardsOf).map((deck) => deck.name)).toEqual([
      'Hog Cycle',
      'Golem Beatdown',
    ]);
    expect(sortDecks([hog, golem], 'updated', true, cardsOf).map((deck) => deck.name)).toEqual([
      'Golem Beatdown',
      'Hog Cycle',
    ]);
  });

  it('sorts by name and average elixir', () => {
    expect(sortDecks([hog, golem], 'name', false, cardsOf).map((deck) => deck.name)).toEqual([
      'Golem Beatdown',
      'Hog Cycle',
    ]);
    expect(sortDecks([hog, golem], 'elixir', false, cardsOf).map((deck) => deck.name)).toEqual([
      'Hog Cycle',
      'Golem Beatdown',
    ]);
  });
});
