import { averageElixir } from './deck.ts';
import { CARD_RARITIES, type CatalogCard, type Deck } from './types.ts';

export type CardSortKey = 'elixir' | 'rarity' | 'name';
export type DeckSortKey = 'updated' | 'name' | 'elixir';

const rarityRank = new Map(CARD_RARITIES.map((rarity, index) => [rarity, index]));

function elixirValue(card: CatalogCard): number {
  return card.elixir ?? Number.POSITIVE_INFINITY;
}

function rarityValue(card: CatalogCard): number {
  return rarityRank.get(card.rarity) ?? CARD_RARITIES.length;
}

function arenaValue(card: CatalogCard): number {
  return card.arenaOrder ?? card.id;
}

export function compareCards(a: CatalogCard, b: CatalogCard, key: CardSortKey, reverse = false): number {
  const dir = reverse ? -1 : 1;
  if (key === 'name') {
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName * dir;
    return elixirValue(a) - elixirValue(b);
  }

  const primary = key === 'elixir' ? elixirValue(a) - elixirValue(b) : rarityValue(a) - rarityValue(b);
  if (primary !== 0) return primary * dir;

  const secondary = key === 'elixir' ? rarityValue(a) - rarityValue(b) : elixirValue(a) - elixirValue(b);
  if (secondary !== 0) return secondary * dir;

  return (arenaValue(a) - arenaValue(b)) * dir;
}

export function sortCards(
  cards: readonly CatalogCard[],
  key: CardSortKey,
  reverse = false,
): CatalogCard[] {
  return cards.slice().sort((a, b) => compareCards(a, b, key, reverse));
}

export function compareDecks(
  a: Deck,
  b: Deck,
  key: DeckSortKey,
  reverse = false,
  elixirOf: (deck: Deck) => number | null,
): number {
  const dir = reverse ? -1 : 1;
  if (key === 'updated') {
    return b.updatedAt.localeCompare(a.updatedAt) * dir;
  }
  if (key === 'name') {
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName * dir;
    return b.updatedAt.localeCompare(a.updatedAt);
  }
  const ae = elixirOf(a) ?? Number.POSITIVE_INFINITY;
  const be = elixirOf(b) ?? Number.POSITIVE_INFINITY;
  if (ae !== be) return (ae - be) * dir;
  return a.name.localeCompare(b.name);
}

export function sortDecks(
  decks: readonly Deck[],
  key: DeckSortKey,
  reverse = false,
  cardsOf: (deck: Deck) => Array<CatalogCard | undefined>,
): Deck[] {
  return decks.slice().sort((a, b) =>
    compareDecks(a, b, key, reverse, (deck) => averageElixir(cardsOf(deck).filter(Boolean))),
  );
}
