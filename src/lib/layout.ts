/** How many items of `minItem` fit in `available` with a constant `gap`. */
export function fitCount(available: number, minItem: number, gap: number, min = 1): number {
  if (available <= 0 || minItem <= 0) return min;
  return Math.max(min, Math.floor((available + gap) / (minItem + gap)));
}

const SLOT_NATURAL_CARD = 96;
const SLOT_NATURAL_GAP = 12;
const SLOT_NATURAL_GRID = 544;

export type DeckSlotLayout = {
  gridWidth: number;
  cardPx: number;
  gapPx: number;
};

/** Scale the editor's 2×4 slot cluster from the comfortable desktop size. */
export function deckSlotLayout(available: number): DeckSlotLayout {
  const width = available > 0 ? available : SLOT_NATURAL_GRID;
  const gridWidth = Math.min(SLOT_NATURAL_GRID, width);
  const scale = gridWidth / SLOT_NATURAL_GRID;
  return {
    gridWidth,
    cardPx: Math.round(SLOT_NATURAL_CARD * scale),
    gapPx: Math.max(6, Math.round(SLOT_NATURAL_GAP * scale)),
  };
}

const TOGGLE_VARIANTS = [
  { fontPx: 10, padX: 8, className: 'px-2 py-0.5 text-[10px]' },
  { fontPx: 9, padX: 6, className: 'px-1.5 py-0.5 text-[9px]' },
  { fontPx: 8, padX: 4, className: 'px-1 py-0.5 text-[8px]' },
] as const;

function pillWidth(label: string, fontPx: number, padX: number): number {
  return label.length * fontPx * 0.72 + padX * 2;
}

/** Pick the largest EVO/HERO pill chrome that still fits two labels on one row. */
export function formToggleClass(slotWidth: number): string {
  const labels = ['EVO', 'HERO'];
  for (const variant of TOGGLE_VARIANTS) {
    const pair =
      labels.reduce((sum, label) => sum + pillWidth(label, variant.fontPx, variant.padX), 0) + 4;
    if (pair <= slotWidth) return variant.className;
  }
  return TOGGLE_VARIANTS[TOGGLE_VARIANTS.length - 1].className;
}

const PICKER_MIN_CELL = 80;
const PICKER_GAP = 8;
const PICKER_MIN_COLUMNS = 4;

export type CardPickerLayout = {
  columns: number;
  gapPx: number;
};

/** Column count for the editor card list from the picker's inner width. */
export function cardPickerLayout(available: number): CardPickerLayout {
  const width = available > 0 ? available : 720;
  return {
    columns: fitCount(width, PICKER_MIN_CELL, PICKER_GAP, PICKER_MIN_COLUMNS),
    gapPx: PICKER_GAP,
  };
}

export const DECK_TILE_GAP = 16;
export const DECK_TILE_MIN = 340;
export const DECK_TILE_IDEAL = 440;
export const DECK_TILE_CARD_GAP = 14;
export const DECK_TILE_CARD = 56;

export type DeckListLayout = {
  columns: number;
  gapPx: number;
  tileWidth: number;
  justify: 'center' | 'flex-start';
};

/**
 * Pack as many fixed-feel deck tiles as will fit. Leftover width stays on the
 * right except for a single column, which is centered.
 */
export function deckListLayout(available: number): DeckListLayout {
  const width = available > 0 ? available : DECK_TILE_IDEAL;
  const columns = fitCount(width, DECK_TILE_MIN, DECK_TILE_GAP, 1);
  if (columns === 1) {
    return {
      columns: 1,
      gapPx: DECK_TILE_GAP,
      tileWidth: Math.min(DECK_TILE_IDEAL, width),
      justify: 'center',
    };
  }
  const stretched = Math.floor((width - (columns - 1) * DECK_TILE_GAP) / columns);
  return {
    columns,
    gapPx: DECK_TILE_GAP,
    tileWidth: Math.min(DECK_TILE_IDEAL, stretched),
    justify: 'flex-start',
  };
}
