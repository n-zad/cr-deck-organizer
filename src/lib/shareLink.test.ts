import { describe, expect, it } from 'vitest';
import { parseShareLink, serializeShareLink, serializeSimpleShareLink } from './shareLink.ts';

const COPY_DECK_LINK =
  'https://link.clashroyale.com/en?clashroyale://copyDeck?deck=28000004;26000000;26000026;27000003;26000041;26000030;28000011;28000003&slots=0;0;0;0;0;0;0;0&tt=159000000';

const SIMPLE_LINK =
  'https://link.clashroyale.com/deck/en?deck=28000004;26000000;26000026;27000003;26000041;26000030;28000011;28000003';

const EXPECTED_IDS = [
  28000004, 26000000, 26000026, 27000003, 26000041, 26000030, 28000011, 28000003,
];

describe('parseShareLink', () => {
  it('parses the typical in-game copyDeck link', () => {
    const result = parseShareLink(COPY_DECK_LINK);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.cardIds).toEqual(EXPECTED_IDS);
    expect(result.value.evolutionSlots).toEqual(Array.from({ length: 8 }, () => false));
    expect(result.value.towerTroopId).toBe(159000000);
  });

  it('parses the simpler /deck/en HTTP form', () => {
    const result = parseShareLink(SIMPLE_LINK);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.cardIds).toEqual(EXPECTED_IDS);
    expect(result.value.towerTroopId).toBeNull();
  });

  it('parses a raw ID list', () => {
    const result = parseShareLink(EXPECTED_IDS.join(';'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.cardIds).toEqual(EXPECTED_IDS);
  });

  it('accepts URL-encoded copyDeck links', () => {
    const encoded = encodeURIComponent(COPY_DECK_LINK);
    const result = parseShareLink(encoded);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.cardIds).toEqual(EXPECTED_IDS);
  });

  it('reads evolution slots and ignores extra whitespace', () => {
    const result = parseShareLink(
      `  clashroyale://copyDeck?deck=${EXPECTED_IDS.join(';')}&slots=1;0;1;0;0;0;0;0  `,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.evolutionSlots[0]).toBe(true);
    expect(result.value.evolutionSlots[2]).toBe(true);
    expect(result.value.evolutionSlots.filter(Boolean)).toHaveLength(2);
  });

  it('rejects empty input', () => {
    const result = parseShareLink('   ');
    expect(result.ok).toBe(false);
  });

  it('rejects a short deck list', () => {
    const result = parseShareLink('https://link.clashroyale.com/deck/en?deck=26000000;26000001');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/8 cards/i);
  });
});

describe('serializeShareLink', () => {
  it('round-trips a parsed copyDeck link', () => {
    const parsed = parseShareLink(COPY_DECK_LINK);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const serialized = serializeShareLink(parsed.value);
    const again = parseShareLink(serialized);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.value).toEqual(parsed.value);
  });

  it('writes the simple HTTP form', () => {
    expect(serializeSimpleShareLink(EXPECTED_IDS)).toBe(SIMPLE_LINK);
  });
});
