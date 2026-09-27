import { describe, expect, it } from 'vitest';
import { createAppStore, newDraftDeck } from './appStore.ts';
import { createFolder } from './deck.ts';
import { MemoryStorage } from './memoryStorage.ts';
import { getCard } from './catalog.ts';
import { defaultSettings } from './settings.ts';

const LOG_BAIT_LINK =
  'https://link.clashroyale.com/en?clashroyale://copyDeck?deck=28000004;26000000;26000026;27000003;26000041;26000030;28000011;28000003&slots=0;0;0;0;0;0;0;0&tt=159000000&id=YGJUVURY';

describe('appStore', () => {
  it('creates folders and unfiles decks when a folder is deleted', () => {
    const store = createAppStore(new MemoryStorage());
    const folder = store.createFolder('Ladder');
    const deck = store.saveDeck(newDraftDeck(folder.id));
    expect(store.getState().decks[0]?.folderId).toBe(folder.id);
    store.deleteFolder(folder.id);
    expect(store.getState().folders).toHaveLength(0);
    expect(store.getState().decks.find((item) => item.id === deck.id)?.folderId).toBeNull();
  });

  it('applies a share link onto a draft deck', () => {
    const store = createAppStore(new MemoryStorage());
    const result = store.applyShareLink(newDraftDeck(), LOG_BAIT_LINK);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.cardIds).toHaveLength(8);
    expect(getCard(result.value.cardIds[0])?.name).toBe('Goblin Barrel');
    expect(getCard(result.value.cardIds[1])?.name).toBe('Knight');
    expect(result.value.towerTroopId).toBe(159000000);
  });

  it('does not add a duplicate card and fills the first empty slot', () => {
    const store = createAppStore(new MemoryStorage());
    const knight = 26000000;
    let deck = store.addCardToDeck(newDraftDeck(), knight);
    const again = store.addCardToDeck(deck, knight);
    expect(again.cardIds.filter((id) => id === knight)).toHaveLength(1);
    deck = store.addCardToDeck(deck, 26000001);
    expect(deck.cardIds[0]).toBe(knight);
    expect(deck.cardIds[1]).toBe(26000001);
  });

  it('persists after replaceState so a second store instance can restore a backup', () => {
    const storage = new MemoryStorage();
    const first = createAppStore(storage);
    first.replaceState({
      schemaVersion: 1,
      folders: [createFolder('Saved')],
      decks: [newDraftDeck()],
      settings: defaultSettings(),
    });
    const second = createAppStore(storage);
    expect(second.getState().folders[0]?.name).toBe('Saved');
    expect(second.getState().decks).toHaveLength(1);
  });

  it('updates settings and prunes decks that have no cards', () => {
    const store = createAppStore(new MemoryStorage());
    store.saveDeck(newDraftDeck());
    store.saveDeck(store.addCardToDeck(newDraftDeck(), 26000000));
    expect(store.getState().decks).toHaveLength(2);
    store.updateSettings({ autoDeleteEmptyDecks: true });
    expect(store.getState().settings.autoDeleteEmptyDecks).toBe(true);
    store.pruneEmptyDecks();
    expect(store.getState().decks).toHaveLength(1);
    expect(store.getState().decks[0]?.cardIds[0]).toBe(26000000);
  });

  it('auto-fits forms and only toggles dual-form cards in the wild slot', () => {
    const store = createAppStore(new MemoryStorage());
    const knight = 26000000;
    let deck = store.setDeckSlot(newDraftDeck(), 0, knight);
    expect(deck.evolutionSlots[0]).toBe(true);
    expect(deck.heroSlots[0]).toBe(false);
    deck = store.toggleDeckHero(deck, 0);
    expect(deck.heroSlots[0]).toBe(false);
    expect(deck.evolutionSlots[0]).toBe(true);

    deck = store.setDeckSlot(deck, 2, knight);
    expect(deck.cardIds[0]).toBeNull();
    expect(deck.evolutionSlots[2]).toBe(true);
    expect(deck.heroSlots[2]).toBe(false);
    deck = store.toggleDeckEvolution(deck, 2);
    expect(deck.evolutionSlots[2]).toBe(false);
    expect(deck.heroSlots[2]).toBe(true);
    deck = store.toggleDeckHero(deck, 2);
    expect(deck.heroSlots[2]).toBe(false);
    expect(deck.evolutionSlots[2]).toBe(true);

    const swapped = store.swapDeckSlots(deck, 2, 3);
    expect(swapped.cardIds[3]).toBe(knight);
    expect(swapped.heroSlots[3]).toBe(false);
    expect(swapped.evolutionSlots[3]).toBe(false);

    const fromGeneric = store.swapDeckSlots(swapped, 3, 2);
    expect(fromGeneric.evolutionSlots[2]).toBe(true);
    expect(fromGeneric.heroSlots[2]).toBe(false);

    let fromHero = store.setDeckSlot(newDraftDeck(), 1, knight);
    expect(fromHero.heroSlots[1]).toBe(true);
    fromHero = store.swapDeckSlots(fromHero, 1, 2);
    expect(fromHero.cardIds[2]).toBe(knight);
    expect(fromHero.heroSlots[2]).toBe(true);
    expect(fromHero.evolutionSlots[2]).toBe(false);
  });
});
