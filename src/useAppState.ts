import { useSyncExternalStore } from 'react';
import { store } from './browserStore.ts';
import { emptyState } from './lib/storage.ts';

export function useAppState() {
  return useSyncExternalStore(store.subscribe, store.getState, emptyState);
}

export { store };
