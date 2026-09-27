import { getCard, isChampionCard } from './catalog.ts';
import { clampName, createId, nowIso } from './ids.ts';
import {
  DECK_SIZE,
  MAX_EVOLUTIONS,
  MAX_HEROES,
  UNTITLED_DECK_NAME,
  type CatalogCard,
  type Deck,
  type Folder,
} from './types.ts';

export function emptySlots(): Array<number | null> {
  return Array.from({ length: DECK_SIZE }, () => null);
}

export function emptyEvolutionSlots(): boolean[] {
  return Array.from({ length: DECK_SIZE }, () => false);
}

export function emptyHeroSlots(): boolean[] {
  return Array.from({ length: DECK_SIZE }, () => false);
}

export function createDeck(partial?: Partial<Deck>): Deck {
  const timestamp = nowIso();
  return {
    id: partial?.id ?? createId(),
    name: clampName(partial?.name ?? '', UNTITLED_DECK_NAME),
    cardIds: normalizeCardSlots(partial?.cardIds),
    evolutionSlots: normalizeEvolutionSlots(partial?.evolutionSlots, partial?.cardIds),
    heroSlots: normalizeHeroSlots(partial?.heroSlots, partial?.cardIds),
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

export function normalizeHeroSlots(
  heroSlots: boolean[] | undefined,
  cardIds?: Array<number | null>,
): boolean[] {
  const slots = emptyHeroSlots();
  if (!heroSlots) return slots;
  let enabled = 0;
  for (let i = 0; i < DECK_SIZE; i += 1) {
    const wanted = heroSlots[i] === true && cardIds?.[i] != null;
    if (wanted && enabled < MAX_HEROES) {
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

export function toggleFlaggedSlot(
  flags: boolean[],
  slotIndex: number,
  allowed: boolean,
  maxEnabled: number,
): boolean[] {
  if (slotIndex < 0 || slotIndex >= DECK_SIZE || !allowed) {
    return flags;
  }
  const next = [...flags];
  if (next[slotIndex]) {
    next[slotIndex] = false;
    return next;
  }
  const enabled = next.filter(Boolean).length;
  if (enabled >= maxEnabled) {
    return flags;
  }
  next[slotIndex] = true;
  return next;
}

export function toggleEvolution(
  evolutionSlots: boolean[],
  slotIndex: number,
  canEvolve: boolean,
): boolean[] {
  return toggleFlaggedSlot(evolutionSlots, slotIndex, canEvolve, MAX_EVOLUTIONS);
}

export function toggleHero(heroSlots: boolean[], slotIndex: number, canBeHero: boolean): boolean[] {
  return toggleFlaggedSlot(heroSlots, slotIndex, canBeHero, MAX_HEROES);
}

export function swapDeckSlots(deck: Deck, from: number, to: number): Deck {
  if (from === to || from < 0 || to < 0 || from >= DECK_SIZE || to >= DECK_SIZE) {
    return deck;
  }
  const cardIds = [...deck.cardIds];
  const evolutionSlots = [...deck.evolutionSlots];
  const heroSlots = [...(deck.heroSlots ?? emptyHeroSlots())];
  [cardIds[from], cardIds[to]] = [cardIds[to], cardIds[from]];
  [evolutionSlots[from], evolutionSlots[to]] = [evolutionSlots[to], evolutionSlots[from]];
  [heroSlots[from], heroSlots[to]] = [heroSlots[to], heroSlots[from]];
  return withUpdatedTimestamp({ ...deck, cardIds, evolutionSlots, heroSlots });
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

export const EVO_SLOT = 0;
export const HERO_SLOT = 1;
export const WILD_SLOT = 2;

export type SlotRole = 'evo' | 'hero' | 'wild' | 'normal';
export type CardFrame = 'none' | 'evo' | 'hero' | 'champion';

export function slotRole(index: number): SlotRole {
  if (index === EVO_SLOT) return 'evo';
  if (index === HERO_SLOT) return 'hero';
  if (index === WILD_SLOT) return 'wild';
  return 'normal';
}

export function slotLabel(index: number): string | null {
  const role = slotRole(index);
  if (role === 'evo') return 'Evo';
  if (role === 'hero') return 'Hero';
  if (role === 'wild') return 'Wild';
  return null;
}

export function cardFrame(evolved: boolean, heroForm: boolean, champion: boolean): CardFrame {
  if (evolved) return 'evo';
  if (heroForm) return 'hero';
  if (champion) return 'champion';
  return 'none';
}

export function isLegalFormSlot(slotIndex: number, frame: CardFrame): boolean {
  if (frame === 'none') return true;
  if (frame === 'evo') return slotIndex === EVO_SLOT || slotIndex === WILD_SLOT;
  return slotIndex === HERO_SLOT || slotIndex === WILD_SLOT;
}

export function canToggleForms(card: CatalogCard | undefined, slotIndex: number): boolean {
  return slotRole(slotIndex) === 'wild' && card?.hasEvolution === true && card?.hasHero === true;
}

export function desiredFormsForSlot(
  slotIndex: number,
  card: CatalogCard | undefined,
  currentEvo: boolean,
  currentHero: boolean,
): { evo: boolean; hero: boolean } {
  if (!card) return { evo: false, hero: false };
  const role = slotRole(slotIndex);
  if (role === 'wild') {
    if (card.hasEvolution && card.hasHero) {
      if (currentHero && !currentEvo) return { evo: false, hero: true };
      return { evo: true, hero: false };
    }
    return { evo: card.hasEvolution, hero: card.hasHero };
  }
  if (role === 'evo') return { evo: card.hasEvolution, hero: false };
  if (role === 'hero') return { evo: false, hero: card.hasHero };
  return { evo: false, hero: false };
}

export function fitDeckForms(deck: Deck): Deck {
  const evolutionSlots = emptyEvolutionSlots();
  const heroSlots = emptyHeroSlots();
  const currentHero = deck.heroSlots ?? emptyHeroSlots();
  let evoCount = 0;
  let heroCount = 0;

  for (let index = 0; index < DECK_SIZE; index += 1) {
    const desired = desiredFormsForSlot(
      index,
      getCard(deck.cardIds[index]),
      deck.evolutionSlots[index] === true,
      currentHero[index] === true,
    );
    if (desired.evo && evoCount < MAX_EVOLUTIONS) {
      evolutionSlots[index] = true;
      evoCount += 1;
    }
    if (desired.hero && heroCount < MAX_HEROES) {
      heroSlots[index] = true;
      heroCount += 1;
    }
  }

  return { ...deck, evolutionSlots, heroSlots };
}

export function shareBlockReason(deck: Deck): string | null {
  if (!isCompleteDeck(deck.cardIds)) {
    return 'Copy needs a full 8-card deck.';
  }
  const illegalChampion = deck.cardIds.some((id, index) => {
    const card = getCard(id);
    return card != null && isChampionCard(card) && !isLegalFormSlot(index, 'champion');
  });
  if (illegalChampion) {
    return 'Move champions into the Hero or Wild slot before copying.';
  }
  return null;
}
