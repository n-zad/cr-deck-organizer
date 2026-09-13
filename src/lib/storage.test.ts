import { describe, expect, it } from 'vitest';
import { MemoryStorage } from './memoryStorage.ts';
import { STORAGE_KEY } from './types.ts';
import { emptyState, loadState, parseState, saveState } from './storage.ts';
import { createDeck, createFolder } from './deck.ts';

describe('storage', () => {
  it('returns an empty state when nothing is stored', () => {
    expect(loadState(new MemoryStorage())).toEqual(emptyState());
  });

  it('round-trips decks and folders', () => {
    const storage = new MemoryStorage();
    const folder = createFolder('Ladder');
    const deck = createDeck({
      name: 'Hog 2.6',
      folderId: folder.id,
      cardIds: [1, 2, 3, 4, 5, 6, 7, 8],
    });
    saveState({ schemaVersion: 1, folders: [folder], decks: [deck] }, storage);
    const loaded = loadState(storage);
    expect(loaded.folders).toEqual([folder]);
    expect(loaded.decks[0]?.name).toBe('Hog 2.6');
    expect(loaded.decks[0]?.cardIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(storage.getItem(STORAGE_KEY)).toContain('Hog 2.6');
  });

  it('recovers from corrupt JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    expect(loadState(storage)).toEqual(emptyState());
  });

  it('drops folder references that no longer exist', () => {
    const state = parseState({
      folders: [{ id: 'keep', name: 'Keep', createdAt: '2026-01-01T00:00:00.000Z' }],
      decks: [
        {
          id: 'deck-1',
          name: 'Orphan',
          cardIds: [],
          folderId: 'missing',
        },
      ],
    });
    expect(state.decks[0]?.folderId).toBeNull();
    expect(state.folders).toHaveLength(1);
  });

  it('ignores malformed records and duplicate ids', () => {
    const state = parseState({
      folders: [
        { id: 'a', name: 'One' },
        { id: 'a', name: 'Two' },
        { name: 'No id' },
      ],
      decks: [{ id: 'd1', name: 'Alpha' }, { id: 'd1', name: 'Beta' }, { name: 'Skip' }],
    });
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0]?.name).toBe('One');
    expect(state.decks).toHaveLength(1);
    expect(state.decks[0]?.name).toBe('Alpha');
  });
});
