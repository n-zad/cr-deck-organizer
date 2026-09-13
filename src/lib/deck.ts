import {
  DECK_SIZE,
  MAX_EVOLUTIONS,
  UNTITLED_DECK_NAME,
  type CatalogCard,
  type Deck,
  type Folder,
} from './types.ts';
import { clampName, createId, nowIso } from './ids.ts';

export function emptySlots(): Array<number | null> {
  return Array.from({ length: DECK_SIZE }, () => null);
}

export function emptyEvolutionSlots(): boolean[] {
  return Array.from({ length: DECK_SIZE }, () => false);
}

export function createDeck(partial?: Partial<Deck>): Deck {
  const timestamp = nowIso();
  return {
    id: partial?.id ?? createId(),
    name: clampName(partial?.name ?? '', UNTITLED_DECK_NAME),
    cardIds: normalizeCardSlots(partial?.cardIds),
    evolutionSlots: normalizeEvolutionSlots(partial?.evolutionSlots, partial?.cardIds),
    towerTroopId: partial?.towerTroopId ?? null,
    folderId: partial?.folderId ?? null,
    createdAt: partial?.createdAt ?? timestamp,
    updatedAt: partial?.updatedAt ?? timestamp,
  };
}

export function createFolder(name: string, partial?: Partial<Folder>): Folder {
  return {
    id: partial?.id ?? createId(),
    name: clampName(name, 'Folder'),
    createdAt: partial?.createdAt ?? nowIso(),
  };
}

export function normalizeCardSlots(
  cardIds: Array<number | null> | undefined,
): Array<number | null> {
  const slots = emptySlots();
  if (!cardIds) return slots;
  for (let i = 0; i < DECK_SIZE; i += 1) {
    const value = cardIds[i];
    slots[i] = typeof value === 'number' && Number.isInteger(value) ? value : null;
  }
  return slots;
}

export function normalizeEvolutionSlots(
  evolutionSlots: boolean[] | undefined,
  cardIds?: Array<number | null>,
): boolean[] {
  const slots = emptyEvolutionSlots();
  if (!evolutionSlots) return slots;
  let enabled = 0;
  for (let i = 0; i < DECK_SIZE; i += 1) {
    const wanted = evolutionSlots[i] === true && cardIds?.[i] != null;
    if (wanted && enabled < MAX_EVOLUTIONS) {
      slots[i] = true;
      enabled += 1;
    }
  }
  return slots;
}

export function filledCardIds(cardIds: Array<number | null>): number[] {
  return cardIds.filter((id): id is number => id != null);
}

export function isCompleteDeck(cardIds: Array<number | null>): boolean {
  const filled = filledCardIds(cardIds);
  return filled.length === DECK_SIZE && new Set(filled).size === DECK_SIZE;
}

export function firstEmptySlot(cardIds: Array<number | null>): number | null {
  const index = cardIds.findIndex((id) => id == null);
  return index === -1 ? null : index;
}

export function toggleEvolution(
  evolutionSlots: boolean[],
  slotIndex: number,
  canEvolve: boolean,
): boolean[] {
  if (slotIndex < 0 || slotIndex >= DECK_SIZE || !canEvolve) {
    return evolutionSlots;
  }
  const next = [...evolutionSlots];
  if (next[slotIndex]) {
    next[slotIndex] = false;
    return next;
  }
  const enabled = next.filter(Boolean).length;
  if (enabled >= MAX_EVOLUTIONS) {
    return evolutionSlots;
  }
  next[slotIndex] = true;
  return next;
}

export function averageElixir(cards: Array<CatalogCard | undefined>): number | null {
  let total = 0;
  let count = 0;
  for (const card of cards) {
    if (!card) continue;
    total += card.elixir ?? 1;
    count += 1;
  }
  if (count === 0) return null;
  return Math.round((total / count) * 10) / 10;
}

export function formatElixir(value: number | null): string {
  if (value == null) return '—';
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export function withUpdatedTimestamp(deck: Deck): Deck {
  return { ...deck, updatedAt: nowIso() };
}
