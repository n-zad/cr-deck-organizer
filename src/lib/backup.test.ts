import { describe, expect, it } from 'vitest';
import { exportBackup, parseBackup, serializeBackup } from './backup.ts';
import { createDeck, createFolder } from './deck.ts';
import { BACKUP_APP_ID } from './types.ts';

describe('backup', () => {
  it('exports and restores a master backup', () => {
    const folder = createFolder('Cycle');
    const deck = createDeck({ name: 'Royal Giant', folderId: folder.id });
    const state = { schemaVersion: 1 as const, folders: [folder], decks: [deck] };
    const json = serializeBackup(state);
    const restored = parseBackup(json);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.value.folders[0]?.name).toBe('Cycle');
    expect(restored.value.decks[0]?.name).toBe('Royal Giant');
  });

  it('rejects non-json text', () => {
    const result = parseBackup('not json');
    expect(result.ok).toBe(false);
  });

  it('rejects backups from a different app', () => {
    const result = parseBackup(JSON.stringify({ app: 'someone-else', folders: [], decks: [] }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not a Deck Organizer backup/i);
  });

  it('rejects backups from a newer schema', () => {
    const result = parseBackup(
      JSON.stringify({
        app: BACKUP_APP_ID,
        schemaVersion: 99,
        folders: [],
        decks: [],
      }),
    );
    expect(result.ok).toBe(false);
  });

  it('includes app metadata on export', () => {
    const backup = exportBackup({ schemaVersion: 1, folders: [], decks: [] }, '2026-09-13T00:00:00.000Z');
    expect(backup.app).toBe(BACKUP_APP_ID);
    expect(backup.exportedAt).toBe('2026-09-13T00:00:00.000Z');
  });
});
