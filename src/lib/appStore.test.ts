import { describe, expect, it } from 'vitest';
import { createAppStore, newDraftDeck } from './appStore.ts';
import { createFolder } from './deck.ts';
import { MemoryStorage } from './memoryStorage.ts';
import { getCard } from './catalog.ts';

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
    });
    const second = createAppStore(storage);
    expect(second.getState().folders[0]?.name).toBe('Saved');
    expect(second.getState().decks).toHaveLength(1);
  });
});
