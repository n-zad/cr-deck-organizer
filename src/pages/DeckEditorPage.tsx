import { useEffect, useMemo, useState } from 'react';
import { CardPicker } from '../components/CardPicker.tsx';
import { DeckSlots } from '../components/DeckSlots.tsx';
import { Modal } from '../components/Modal.tsx';
import { ShareLinkField } from '../components/ShareLinkField.tsx';
import { Button, IconBack, IconCopy, IconTrash } from '../components/ui.tsx';
import { catalog, getCard } from '../lib/catalog.ts';
import { filledCardIds } from '../lib/deck.ts';
import { navigate } from '../lib/hashRoute.ts';
import { canShare, newDraftDeck } from '../lib/appStore.ts';
import { serializeShareLink } from '../lib/shareLink.ts';
import { UNTITLED_DECK_NAME, type CatalogCard, type Deck } from '../lib/types.ts';
import { store, useAppState } from '../useAppState.ts';

type DeckEditorPageProps = {
  deckId?: string;
};

export function DeckEditorPage({ deckId }: DeckEditorPageProps) {
  const state = useAppState();
  const [deck, setDeck] = useState<Deck>(() => findDeck(deckId) ?? newDraftDeck());
  const notFound = Boolean(deckId && deck.id !== deckId);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (notFound) return;
    const hasContent =
      deck.name !== UNTITLED_DECK_NAME ||
      filledCardIds(deck.cardIds).length > 0 ||
      deck.folderId != null;
    if (!hasContent && !deckId) return;

    const timer = window.setTimeout(() => {
      store.saveDeck(deck);
      if (!deckId) navigate(`/deck/${deck.id}`, true);
      setSavedFlash(true);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [deck, deckId, notFound]);

  useEffect(() => {
    if (!savedFlash) return;
    const timer = window.setTimeout(() => setSavedFlash(false), 900);
    return () => window.clearTimeout(timer);
  }, [savedFlash]);

  const folders = useMemo(
    () => state.folders.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [state.folders],
  );

  function placeCard(card: CatalogCard): void {
    const existing = deck.cardIds.indexOf(card.id);
    if (existing !== -1) {
      setSelectedSlot(existing);
      return;
    }
    const next =
      selectedSlot != null
        ? store.setDeckSlot(deck, selectedSlot, card.id)
        : store.addCardToDeck(deck, card.id);
    setDeck(next);
    const nextEmpty = next.cardIds.findIndex((id) => id == null);
    setSelectedSlot(nextEmpty === -1 ? selectedSlot : nextEmpty);
  }

  function applyLink(pasted: string): string | null {
    const result = store.applyShareLink(deck, pasted);
    if (!result.ok) return result.error;
    setDeck(result.value);
    setSelectedSlot(null);
    return null;
  }

  async function copyLink(): Promise<void> {
    if (!canShare(deck)) return;
    const url = serializeShareLink({
      cardIds: filledCardIds(deck.cardIds),
      evolutionSlots: deck.evolutionSlots,
      towerTroopId: deck.towerTroopId,
    });
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    window.setTimeout(() => setCopyState('idle'), 1500);
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Deck not found</h1>
        <p className="mt-2 text-cream-400">It may have been deleted or is not in this browser.</p>
        <div className="mt-6">
          <Button onClick={() => navigate('/')}>Back to decks</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <IconBack />
          Decks
        </Button>
        <span className="text-xs text-cream-400">
          {savedFlash ? 'Saved' : 'Auto-saves in this browser'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="ghost" disabled={!canShare(deck)} onClick={() => void copyLink()}>
            <IconCopy />
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy share link'}
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <IconTrash />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_220px]">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold tracking-wide text-cream-400 uppercase">
            Name
          </span>
          <input
            value={deck.name}
            onChange={(event) => setDeck({ ...deck, name: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-navy-800 px-4 py-3 text-lg font-medium outline-none focus:border-gold-400/50"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold tracking-wide text-cream-400 uppercase">
            Folder
          </span>
          <select
            value={deck.folderId ?? ''}
            onChange={(event) => setDeck({ ...deck, folderId: event.target.value || null })}
            className="w-full rounded-2xl border border-white/10 bg-navy-800 px-3 py-3 text-sm outline-none focus:border-gold-400/50"
          >
            <option value="">Unfiled</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold tracking-wide text-cream-400 uppercase">
            Tower troop
          </span>
          <select
            value={deck.towerTroopId ?? ''}
            onChange={(event) =>
              setDeck({
                ...deck,
                towerTroopId: event.target.value ? Number(event.target.value) : null,
              })
            }
            className="w-full rounded-2xl border border-white/10 bg-navy-800 px-3 py-3 text-sm outline-none focus:border-gold-400/50"
          >
            <option value="">None</option>
            {catalog.towerTroops.map((troop) => (
              <option key={troop.id} value={troop.id}>
                {troop.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DeckSlots
        deck={deck}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        onClearSlot={(index) => {
          setDeck(store.setDeckSlot(deck, index, null));
        }}
        onToggleEvolution={(index) => {
          const card = getCard(deck.cardIds[index]);
          if (!card?.hasEvolution) return;
          setDeck(store.toggleDeckEvolution(deck, index));
        }}
      />

      <ShareLinkField onApply={applyLink} />
      <CardPicker selectedIds={deck.cardIds} onPick={placeCard} />

      {confirmDelete && (
        <Modal
          title="Delete this deck?"
          confirmLabel="Delete deck"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            store.deleteDeck(deck.id);
            navigate('/');
          }}
        >
          {deck.name} will be removed from this browser. A backup file is the only way to get it
          back.
        </Modal>
      )}
    </div>
  );
}

function findDeck(deckId: string | undefined): Deck | undefined {
  if (!deckId) return undefined;
  return store.getState().decks.find((item) => item.id === deckId);
}
