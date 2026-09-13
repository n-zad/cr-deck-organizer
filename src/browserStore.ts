import { createAppStore } from './lib/appStore.ts';

export const store = createAppStore(window.localStorage);
