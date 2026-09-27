import { describe, expect, it } from 'vitest';
import {
  cardPickerLayout,
  deckListLayout,
  DECK_TILE_IDEAL,
  deckSlotLayout,
  fitCount,
  formToggleClass,
} from './layout.ts';

describe('layout helpers', () => {
  it('fits as many items as the available width allows', () => {
    expect(fitCount(436, 80, 8, 4)).toBe(5);
    expect(fitCount(400, 80, 8, 4)).toBe(4);
    expect(fitCount(560, 80, 8, 4)).toBe(6);
    expect(fitCount(0, 80, 8, 4)).toBe(4);
  });

  it('gives the card picker five columns around a 500px-wide editor', () => {
    expect(cardPickerLayout(436).columns).toBe(5);
    expect(cardPickerLayout(400).columns).toBe(4);
    expect(cardPickerLayout(560).columns).toBe(6);
  });

  it('keeps editor slots at the desktop card size until the cluster must shrink', () => {
    const wide = deckSlotLayout(700);
    expect(wide.cardPx).toBe(96);
    expect(wide.gapPx).toBe(12);
    expect(wide.gridWidth).toBe(544);

    const mid = deckSlotLayout(436);
    expect(mid.gridWidth).toBe(436);
    expect(mid.cardPx).toBe(Math.round(96 * (436 / 544)));
    expect(mid.cardPx).toBeGreaterThan(70);
    expect(mid.gapPx).toBeLessThan(12);
  });

  it('shrinks evo/hero pills so a dual-form pair stays on one row', () => {
    expect(formToggleClass(96)).toMatch(/text-\[10px\]/);
    expect(formToggleClass(74)).not.toMatch(/text-\[10px\]/);
    expect(formToggleClass(60)).toMatch(/text-\[8px\]/);
  });

  it('packs deck tiles without stretching the last column', () => {
    const twoCol = deckListLayout(900);
    expect(twoCol.columns).toBe(2);
    expect(twoCol.tileWidth).toBe(DECK_TILE_IDEAL);
    expect(twoCol.justify).toBe('flex-start');
    expect(twoCol.columns * twoCol.tileWidth + twoCol.gapPx).toBeLessThanOrEqual(900);

    const oneCol = deckListLayout(500);
    expect(oneCol.columns).toBe(1);
    expect(oneCol.justify).toBe('center');
    expect(oneCol.tileWidth).toBeLessThanOrEqual(DECK_TILE_IDEAL);

    const threeCol = deckListLayout(1232);
    expect(threeCol.columns).toBe(3);
    expect(threeCol.tileWidth).toBeLessThanOrEqual(DECK_TILE_IDEAL);
  });
});
