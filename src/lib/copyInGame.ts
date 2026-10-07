import { filledCardIds } from './deck.ts';
import { serializeCopyDeckDeepLink } from './shareLink.ts';
import type { Deck } from './types.ts';

const NOT_OPENED_CHECK_MS = 1500;

/** Callers must check `shareBlockReason` first; this assumes a complete, legal deck. */
export function openDeckInGame(deck: Deck, onNotOpened: () => void): void {
  window.location.href = serializeCopyDeckDeepLink({
    cardIds: filledCardIds(deck.cardIds),
    evolutionSlots: deck.evolutionSlots,
    towerTroopId: deck.towerTroopId,
  });
  window.setTimeout(() => {
    if (document.visibilityState === 'visible' && document.hasFocus()) onNotOpened();
  }, NOT_OPENED_CHECK_MS);
}
