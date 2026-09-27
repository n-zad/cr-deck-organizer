import { getCard } from './catalog.ts';
import { clampName, createId, nowIso } from './ids.ts';
import {
  canToggleForms,
  createDeck,
  createFolder,
  emptyHeroSlots,
  filledCardIds,
  firstEmptySlot,
  fitDeckForms,
  normalizeEvolutionSlots,
  shareBlockReason,
  slotRole,
  swapDeckSlots,
  withUpdatedTimestamp,
} from './deck.ts';
import { parseShareLink } from './shareLink.ts';
import { emptyState, loadState, saveState } from './storage.ts';
import {
  UNTITLED_DECK_NAME,
  err,
  ok,
  type AppState,
  type Deck,
  type Folder,
  type Result,
  type UserSettings,
} from './types.ts';

export type AppStore = {
  getState: () => AppState;
  subscribe: (listener: () => void) => () => void;
  replaceState: (state: AppState) => void;
  createFolder: (name: string) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  saveDeck: (deck: Deck) => Deck;
  deleteDeck: (id: string) => void;
  moveDeck: (deckId: string, folderId: string | null) => void;
  applyShareLink: (deck: Deck, pasted: string) => Result<Deck>;
  setDeckSlot: (deck: Deck, slotIndex: number, cardId: number | null) => Deck;
  addCardToDeck: (deck: Deck, cardId: number, preferredSlot?: number | null) => Deck;
  toggleDeckEvolution: (deck: Deck, slotIndex: number) => Deck;
  toggleDeckHero: (deck: Deck, slotIndex: number) => Deck;
  swapDeckSlots: (deck: Deck, from: number, to: number) => Deck;
  updateSettings: (patch: Partial<UserSettings>) => void;
  pruneEmptyDecks: () => void;
};

export function createAppStore(storage: Storage): AppStore {
  let state = loadState(storage);
  const listeners = new Set<() => void>();

  function emit(next: AppState): void {
    state = next;
    saveState(state, storage);
    for (const listener of listeners) listener();
  }

  function update(mutator: (current: AppState) => AppState): void {
    emit(mutator(state));
  }

  function setDeckSlot(deck: Deck, slotIndex: number, cardId: number | null): Deck {
    if (slotIndex < 0 || slotIndex >= deck.cardIds.length) return deck;
    const cardIds = [...deck.cardIds];
    if (cardId != null) {
      const existing = cardIds.indexOf(cardId);
      if (existing !== -1 && existing !== slotIndex) {
        cardIds[existing] = null;
      }
    }
    cardIds[slotIndex] = cardId;
    const placed = cardId != null ? getCard(cardId) : undefined;
    const dualWild =
      placed != null &&
      slotRole(slotIndex) === 'wild' &&
      placed.hasEvolution &&
      placed.hasHero;
    const evolutionSlots = deck.evolutionSlots.map((enabled, index) => {
      if (index !== slotIndex) return enabled;
      if (!placed) return false;
      if (dualWild) return true;
      return enabled && placed.hasEvolution;
    });
    const currentHeroSlots = deck.heroSlots ?? emptyHeroSlots();
    const heroSlots = currentHeroSlots.map((enabled, index) => {
      if (index !== slotIndex) return enabled;
      if (!placed) return false;
      if (dualWild) return false;
      return enabled && placed.hasHero;
    });
    return fitDeckForms(withUpdatedTimestamp({ ...deck, cardIds, evolutionSlots, heroSlots }));
  }

  function addCardToDeck(deck: Deck, cardId: number, preferredSlot: number | null = null): Deck {
    if (deck.cardIds.includes(cardId)) return deck;
    const slot = preferredSlot ?? firstEmptySlot(deck.cardIds);
    if (slot == null) return deck;
    return setDeckSlot(deck, slot, cardId);
  }

  function applyShareLink(deck: Deck, pasted: string): Result<Deck> {
    const parsed = parseShareLink(pasted);
    if (!parsed.ok) return parsed;
    const unknown = parsed.value.cardIds.filter((id) => !getCard(id));
    if (unknown.length > 0) {
      return err(
        `Unknown card ID${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Try refreshing the card catalog.`,
      );
    }
    const evolutionSlots = normalizeEvolutionSlots(
      parsed.value.evolutionSlots,
      parsed.value.cardIds,
    ).map((enabled, index) => enabled && getCard(parsed.value.cardIds[index])?.hasEvolution === true);
    return ok(
      fitDeckForms(
        withUpdatedTimestamp({
          ...deck,
          cardIds: parsed.value.cardIds,
          evolutionSlots,
          heroSlots: emptyHeroSlots(),
          towerTroopId: parsed.value.towerTroopId,
        }),
      ),
    );
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    replaceState(next) {
      emit(next);
    },
    createFolder(name) {
      const folder = createFolder(name);
      update((current) => ({ ...current, folders: [...current.folders, folder] }));
      return folder;
    },
    renameFolder(id, name) {
      const nextName = clampName(name, 'Folder');
      update((current) => ({
        ...current,
        folders: current.folders.map((folder) =>
          folder.id === id ? { ...folder, name: nextName } : folder,
        ),
      }));
    },
    deleteFolder(id) {
      update((current) => ({
        ...current,
        folders: current.folders.filter((folder) => folder.id !== id),
        decks: current.decks.map((deck) =>
          deck.folderId === id ? withUpdatedTimestamp({ ...deck, folderId: null }) : deck,
        ),
      }));
    },
    saveDeck(deck) {
      const saved = withUpdatedTimestamp({
        ...deck,
        name: clampName(deck.name, UNTITLED_DECK_NAME),
      });
      update((current) => {
        const index = current.decks.findIndex((item) => item.id === saved.id);
        const decks = [...current.decks];
        if (index === -1) decks.push(saved);
        else decks[index] = saved;
        return { ...current, decks };
      });
      return saved;
    },
    deleteDeck(id) {
      update((current) => ({
        ...current,
        decks: current.decks.filter((deck) => deck.id !== id),
      }));
    },
    moveDeck(deckId, folderId) {
      update((current) => ({
        ...current,
        decks: current.decks.map((deck) =>
          deck.id === deckId ? withUpdatedTimestamp({ ...deck, folderId }) : deck,
        ),
      }));
    },
    applyShareLink,
    setDeckSlot,
    addCardToDeck,
    toggleDeckEvolution(deck, slotIndex) {
      const card = getCard(deck.cardIds[slotIndex]);
      if (!canToggleForms(card, slotIndex)) return deck;
      const wantEvo = deck.evolutionSlots[slotIndex] !== true;
      return fitDeckForms(
        withUpdatedTimestamp({
          ...deck,
          evolutionSlots: deck.evolutionSlots.map((enabled, index) =>
            index === slotIndex ? wantEvo : enabled,
          ),
          heroSlots: (deck.heroSlots ?? emptyHeroSlots()).map((enabled, index) =>
            index === slotIndex ? !wantEvo : enabled,
          ),
        }),
      );
    },
    toggleDeckHero(deck, slotIndex) {
      const card = getCard(deck.cardIds[slotIndex]);
      if (!canToggleForms(card, slotIndex)) return deck;
      const currentHeroSlots = deck.heroSlots ?? emptyHeroSlots();
      const wantHero = currentHeroSlots[slotIndex] !== true;
      return fitDeckForms(
        withUpdatedTimestamp({
          ...deck,
          heroSlots: currentHeroSlots.map((enabled, index) =>
            index === slotIndex ? wantHero : enabled,
          ),
          evolutionSlots: deck.evolutionSlots.map((enabled, index) =>
            index === slotIndex ? !wantHero : enabled,
          ),
        }),
      );
    },
    swapDeckSlots(deck, from, to) {
      return fitDeckForms(swapDeckSlots(deck, from, to));
    },
    updateSettings(patch) {
      update((current) => ({
        ...current,
        settings: { ...current.settings, ...patch },
      }));
    },
    pruneEmptyDecks() {
      if (!state.decks.some((deck) => filledCardIds(deck.cardIds).length === 0)) return;
      update((current) => ({
        ...current,
        decks: current.decks.filter((deck) => filledCardIds(deck.cardIds).length > 0),
      }));
    },
  };
}

export function newDraftDeck(
  folderId: string | null = null,
  towerTroopId: number | null = null,
): Deck {
  return createDeck({
    id: createId(),
    folderId,
    towerTroopId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export function canShare(deck: Deck): boolean {
  return shareBlockReason(deck) == null;
}

export { shareBlockReason };

export { emptyState };
