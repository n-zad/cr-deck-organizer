import {
  APP_SCHEMA_VERSION,
  BACKUP_APP_ID,
  err,
  ok,
  type AppState,
  type BackupFile,
  type Result,
} from './types.ts';
import { emptyState, parseState } from './storage.ts';

export function exportBackup(state: AppState, exportedAt = new Date().toISOString()): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: APP_SCHEMA_VERSION,
    exportedAt,
    folders: state.folders,
    decks: state.decks,
  };
}

export function serializeBackup(state: AppState): string {
  return `${JSON.stringify(exportBackup(state), null, 2)}\n`;
}

export function parseBackup(raw: string): Result<AppState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err('That file is not valid JSON.');
  }
  if (!isRecord(parsed)) {
    return err('That backup file is missing its contents.');
  }
  if (parsed.app != null && parsed.app !== BACKUP_APP_ID) {
    return err('That JSON file is not a Deck Organizer backup.');
  }
  if (
    parsed.schemaVersion != null &&
    (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion > APP_SCHEMA_VERSION)
  ) {
    return err('That backup was created by a newer version of the app.');
  }
  const state = parseState({
    schemaVersion: APP_SCHEMA_VERSION,
    folders: parsed.folders,
    decks: parsed.decks,
  });
  if (state.decks.length === 0 && state.folders.length === 0 && !Array.isArray(parsed.decks)) {
    return err('That backup does not contain any decks or folders.');
  }
  return ok(state);
}

export function backupFileName(exportedAt = new Date()): string {
  const stamp = exportedAt.toISOString().slice(0, 10);
  return `cr-deck-organizer-backup-${stamp}.json`;
}

export { emptyState };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
