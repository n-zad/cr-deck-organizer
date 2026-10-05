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

  it('fills a deck from loose card names and warns about skipped words', () => {
    const store = createAppStore(new MemoryStorage());
    const result = store.applyDeckText(
      newDraftDeck(),
      'evo gob barrel hero knight, evoprincess, infernotower ice spirit gob gang log, rocket',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.warning).toBeNull();
    expect(result.value.deck.cardIds.map((id) => getCard(id)?.name)).toEqual([
      'Goblin Barrel',
      'Knight',
      'Princess',
      'Inferno Tower',
      'Ice Spirit',
      'Goblin Gang',
      'The Log',
      'Rocket',
    ]);
    expect(result.value.deck.evolutionSlots[0]).toBe(true);
    expect(result.value.deck.heroSlots[1]).toBe(true);
    expect(result.value.deck.evolutionSlots[2]).toBe(true);
    expect(result.value.deck.cardIds[8]).toBeUndefined();

    const short = store.applyDeckText(newDraftDeck(), 'hog rider, asdf, musketeer');
    expect(short.ok).toBe(true);
    if (!short.ok) return;
    expect(short.value.deck.cardIds.slice(0, 3).map((id) => (id == null ? null : getCard(id)?.name))).toEqual([
      'Hog Rider',
      'Musketeer',
      null,
    ]);
    expect(short.value.warning).toBe('Could not match: "asdf".');

    const heroWild = store.applyDeckText(newDraftDeck(), 'zap arrows hero knight');
    expect(heroWild.ok).toBe(true);
    if (!heroWild.ok) return;
    expect(heroWild.value.deck.cardIds.slice(0, 3).map((id) => getCard(id)?.name)).toEqual([
      'Zap',
      'Knight',
      'Arrows',
    ]);
    expect(heroWild.value.deck.heroSlots[1]).toBe(true);
    expect(heroWild.value.deck.heroSlots[2]).toBe(false);
  });

  it('adds matched cards into an open deck and parks an evo in the evo slot', () => {
    const store = createAppStore(new MemoryStorage());
    const started = store.applyDeckText(newDraftDeck(), 'rocket zap');
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const added = store.applyDeckText(started.value.deck, 'evo wall breaker, hero knight');
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.placed).toBe(2);
    expect(added.value.deck.cardIds.slice(0, 4).map((id) => getCard(id)?.name)).toEqual([
      'Wall Breakers',
      'Knight',
      'Rocket',
      'Zap',
    ]);
    expect(added.value.deck.evolutionSlots[0]).toBe(true);
    expect(added.value.deck.heroSlots[1]).toBe(true);
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

  it('does not turn on forms the player has marked unowned, and keeps that list when tracking is off', () => {
    const store = createAppStore(new MemoryStorage());
    const knight = 26000000;
    store.updateSettings({
      trackOwnedVariants: true,
      disabledEvolutionIds: [knight],
      disabledHeroIds: [knight],
    });

    const evoSlot = store.setDeckSlot(newDraftDeck(), 0, knight);
    expect(evoSlot.evolutionSlots[0]).toBe(false);
    expect(evoSlot.heroSlots[0]).toBe(false);

    const wild = store.setDeckSlot(newDraftDeck(), 2, knight);
    expect(wild.evolutionSlots[2]).toBe(false);
    expect(wild.heroSlots[2]).toBe(false);

    store.updateSettings({ disabledHeroIds: [] });
    const heroWild = store.setDeckSlot(newDraftDeck(), 2, knight);
    expect(heroWild.evolutionSlots[2]).toBe(false);
    expect(heroWild.heroSlots[2]).toBe(true);

    store.updateSettings({ trackOwnedVariants: false });
    expect(store.getState().settings.disabledEvolutionIds).toEqual([knight]);
    expect(store.getState().settings.disabledHeroIds).toEqual([]);
    const restored = store.setDeckSlot(newDraftDeck(), 0, knight);
    expect(restored.evolutionSlots[0]).toBe(true);
  });
});
