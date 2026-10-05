import { describe, expect, it } from 'vitest';
import { catalog, getCard } from './catalog.ts';
import { createDeck } from './deck.ts';
import { parseDeckText, placeParsedCards } from './deckText.ts';
import type { ParsedDeckText, ParsedTextCard } from './deckText.ts';
import type { Result } from './types.ts';

function cardId(name: string): number {
  const card = catalog.cards.find((item) => item.name === name);
  if (!card) throw new Error(name);
  return card.id;
}

function names(cards: ParsedTextCard[]): string[] {
  return cards.map((card) => getCard(card.cardId)?.name ?? '?');
}

function parsed(input: string): ParsedDeckText {
  const result = parseDeckText(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

function failed(input: string): Extract<Result<ParsedDeckText>, { ok: false }> {
  const result = parseDeckText(input);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('expected the text to be rejected');
  return result;
}

describe('parseDeckText', () => {
  it('reads a loose list with slang, glued words, and evo or hero markers', () => {
    const result = parsed(
      'evo gob barrel hero knight, evoprincess, infernotower ice spirit gob gang log, rocket',
    );
    expect(names(result.cards)).toEqual([
      'Goblin Barrel',
      'Knight',
      'Princess',
      'Inferno Tower',
      'Ice Spirit',
      'Goblin Gang',
      'The Log',
      'Rocket',
    ]);
    expect(result.cards[0]).toMatchObject({ evolution: true, hero: false });
    expect(result.cards[1]).toMatchObject({ evolution: false, hero: true });
    expect(result.cards[2]).toMatchObject({ evolution: true, hero: false });
    expect(result.warning).toBeNull();
  });

  it('maps ebarbs to elite barbarians', () => {
    expect(names(parsed('ebarbs').cards)).toEqual(['Elite Barbarians']);
  });

  it('accepts a singular word in a plural card name', () => {
    expect(names(parsed('wall breaker').cards)).toEqual(['Wall Breakers']);
    expect(names(parsed('evo wall breaker').cards)).toEqual(['Wall Breakers']);
    expect(parsed('evo wall breaker').cards[0]).toMatchObject({ evolution: true, hero: false });
    expect(names(parsed('spear goblin').cards)).toEqual(['Spear Goblins']);
    expect(names(parsed('hog').cards)).toEqual(['Hog Rider']);
    expect(names(parsed('royal hog').cards)).toEqual(['Royal Hogs']);
  });

  it('keeps skeleton and giant separate when that split already fits', () => {
    const result = parsed('skeleton giant knight archers musketeer zap arrows bats');
    expect(names(result.cards)).toEqual([
      'Skeletons',
      'Giant',
      'Knight',
      'Archers',
      'Musketeer',
      'Zap',
      'Arrows',
      'Bats',
    ]);
  });

  it('merges a reversed name when the split would be a ninth card', () => {
    const result = parsed('skeleton giant knight archers musketeer zap arrows bats hog');
    expect(names(result.cards)).toEqual([
      'Giant Skeleton',
      'Knight',
      'Archers',
      'Musketeer',
      'Zap',
      'Arrows',
      'Bats',
      'Hog Rider',
    ]);
    expect(result.warning).toBeNull();
  });

  it('does not guess when more than one merge would fit', () => {
    const result = failed('barrel skeleton giant knight archers musketeer zap arrows bats');
    expect(result.error).toMatch(/9 cards/);
  });

  it('rejects a list that is still longer than a deck', () => {
    const result = failed('knight archers musketeer zap arrows bats hog rocket giant');
    expect(result.error).toMatch(/9 cards/);
  });

  it('fills a short list and reports the words it skipped', () => {
    const result = parsed('hog rider, asdf, musketeer');
    expect(names(result.cards)).toEqual(['Hog Rider', 'Musketeer']);
    expect(result.warning).toBe('Could not match: "asdf".');
  });

  it('leaves a bare gob unmatched and still keeps the other cards', () => {
    const result = parsed('gob knight');
    expect(names(result.cards)).toEqual(['Knight']);
    expect(result.warning).toBe('Could not match: "gob".');
  });

  it('rejects text that matches nothing', () => {
    expect(failed('gob').error).toBe('Could not match: "gob".');
    expect(failed('   ').error).toMatch(/card names/i);
  });

  it('skips a repeated card', () => {
    const result = parsed('knight knight archers');
    expect(names(result.cards)).toEqual(['Knight', 'Archers']);
    expect(result.warning).toBe('Skipped a duplicate Knight.');
  });

  it('prefers mini pekka over pekka when both words are present', () => {
    expect(names(parsed('mini pekka').cards)).toEqual(['Mini P.E.K.K.A']);
    expect(names(parsed('pekka').cards)).toEqual(['P.E.K.K.A']);
  });
});

describe('placeParsedCards', () => {
  it('moves a parsed evo and hero into those slots ahead of plain cards', () => {
    const placed = placeParsedCards(
      createDeck(),
      [
        { cardId: cardId('Knight'), evolution: false, hero: false },
        { cardId: cardId('Goblin Barrel'), evolution: true, hero: false },
        { cardId: cardId('Musketeer'), evolution: false, hero: true },
      ],
      null,
    );
    expect(placed.cardIds.slice(0, 3).map((id) => getCard(id)?.name)).toEqual([
      'Goblin Barrel',
      'Musketeer',
      'Knight',
    ]);
    expect(placed.evolutionSlots[0]).toBe(true);
    expect(placed.heroSlots[1]).toBe(true);
    expect(placed.placed).toBe(3);
  });

  it('adds into an open deck and swaps a plain card out of the evo and hero slots', () => {
    const deck = createDeck({
      cardIds: [cardId('Rocket'), cardId('Zap'), null, null, null, null, null, null],
    });
    const placed = placeParsedCards(
      deck,
      [
        { cardId: cardId('Wall Breakers'), evolution: true, hero: false },
        { cardId: cardId('Knight'), evolution: false, hero: true },
      ],
      null,
    );
    expect(placed.cardIds.slice(0, 4).map((id) => getCard(id)?.name)).toEqual([
      'Wall Breakers',
      'Knight',
      'Rocket',
      'Zap',
    ]);
    expect(placed.evolutionSlots[0]).toBe(true);
    expect(placed.heroSlots[1]).toBe(true);
    expect(placed.evolutionSlots[2]).toBe(false);
    expect(placed.heroSlots[3]).toBe(false);
  });

  it('leaves an evo slot alone when that card is already toggled on', () => {
    const deck = createDeck({
      cardIds: [cardId('Archers'), null, null, null, null, null, null, null],
      evolutionSlots: [true, false, false, false, false, false, false, false],
    });
    const placed = placeParsedCards(
      deck,
      [{ cardId: cardId('Bats'), evolution: true, hero: false }],
      null,
    );
    expect(getCard(placed.cardIds[0])?.name).toBe('Archers');
    expect(placed.cardIds[1]).toBeNull();
    expect(getCard(placed.cardIds[2])?.name).toBe('Bats');
    expect(placed.evolutionSlots[0]).toBe(true);
    expect(placed.evolutionSlots[2]).toBe(true);
  });

  it('replaces a full deck instead of appending', () => {
    const deck = createDeck({
      cardIds: [
        cardId('Zap'),
        cardId('Arrows'),
        cardId('Knight'),
        cardId('Archers'),
        cardId('Musketeer'),
        cardId('Bats'),
        cardId('Rocket'),
        cardId('Giant'),
      ],
    });
    const placed = placeParsedCards(
      deck,
      [{ cardId: cardId('Hog Rider'), evolution: false, hero: false }],
      null,
    );
    expect(getCard(placed.cardIds[0])?.name).toBe('Hog Rider');
    expect(placed.cardIds[1]).toBeNull();
    expect(placed.placed).toBe(1);
  });

  it('does not add a card that is already in the deck', () => {
    const deck = createDeck({
      cardIds: [cardId('Knight'), null, null, null, null, null, null, null],
    });
    const placed = placeParsedCards(
      deck,
      [{ cardId: cardId('Knight'), evolution: false, hero: false }],
      null,
    );
    expect(placed.placed).toBe(0);
    expect(placed.warning).toBe('Already in the deck: Knight.');
    expect(placed.cardIds[0]).toBe(cardId('Knight'));
  });
});
