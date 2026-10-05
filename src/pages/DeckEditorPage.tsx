import { useEffect, useMemo, useState } from 'react';
import { CardPicker } from '../components/CardPicker.tsx';
import { DeckSlots } from '../components/DeckSlots.tsx';
import { Modal } from '../components/Modal.tsx';
import { ShareLinkField } from '../components/ShareLinkField.tsx';
import { TextDeckField } from '../components/TextDeckField.tsx';
import { Button, IconBack, IconCopy, IconPlus, IconTrash } from '../components/ui.tsx';
import { catalog, getCard } from '../lib/catalog.ts';
import { filledCardIds, fitDeckForms, shareBlockReason } from '../lib/deck.ts';
import { navigate } from '../lib/hashRoute.ts';
import { newDraftDeck } from '../lib/appStore.ts';
import { serializeShareLink } from '../lib/shareLink.ts';
import { ownedFormsForSettings, showsImportField } from '../lib/settings.ts';
import { DECK_SIZE, UNTITLED_DECK_NAME, type CatalogCard, type Deck } from '../lib/types.ts';
import { store, useAppState } from '../useAppState.ts';

type DeckEditorPageProps = {
  deckId?: string;
};

export function DeckEditorPage({ deckId }: DeckEditorPageProps) {
  const state = useAppState();
  const [deck, setDeck] = useState<Deck>(() =>
    fitDeckForms(
      findDeck(deckId) ?? newDraftDeck(null, store.getState().settings.defaultTowerTroopId),
      ownedFormsForSettings(store.getState().settings),
    ),
  );
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const notFound = Boolean(deckId && deck.id !== deckId);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error' | 'blocked'>('idle');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [textNotice, setTextNotice] = useState<{ tone: 'ok' | 'warn' | 'error'; message: string } | null>(
    null,
  );
  const showName = !state.settings.hideDeckNames;
  const showFolder = !state.settings.ignoreFolders;
  const filledCount = filledCardIds(deck.cardIds).length;
  const showImport = showsImportField(state.settings.importDeck, filledCount);
  const showTextMatch = showsImportField(state.settings.textDeck, filledCount);

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
    setSelectedSlot(0);
    return null;
  }

  function applyText(
    value: string,
  ): { ok: true; message: string; tone: 'ok' | 'warn'; clear: boolean } | { ok: false; error: string } {
    const merging =
      filledCardIds(deck.cardIds).length > 0 && filledCardIds(deck.cardIds).length < 8;
    const result = store.applyDeckText(deck, value);
    if (!result.ok) {
      setTextNotice({ tone: 'error', message: result.error });
      return result;
    }
    const lead = merging ? 'Added the matched cards.' : 'Matched a deck from that text.';
    const message =
      result.value.placed === 0
        ? (result.value.warning ?? 'Those cards are already in this deck.')
        : result.value.warning
          ? `${lead} ${result.value.warning}`
          : lead;
    const tone = result.value.warning || result.value.placed === 0 ? 'warn' : 'ok';
    if (result.value.placed > 0) {
      setDeck(result.value.deck);
      setSelectedSlot(0);
    }
    setTextNotice({ tone, message });
    return { ok: true, message, tone, clear: result.value.placed > 0 };
  }

  async function copyLink(): Promise<void> {
    const blocked = shareBlockReason(deck);
    if (blocked) {
      setCopyState('blocked');
      setCopyMessage(blocked);
      window.setTimeout(() => {
        setCopyState('idle');
        setCopyMessage(null);
      }, 2800);
      return;
    }
    const url = serializeShareLink({
      cardIds: filledCardIds(deck.cardIds),
      evolutionSlots: deck.evolutionSlots,
      towerTroopId: deck.towerTroopId,
    });
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
      setCopyMessage(null);
    } catch {
      setCopyState('error');
      setCopyMessage('Could not copy the share link.');
    }
    window.setTimeout(() => {
      setCopyState('idle');
      setCopyMessage(null);
    }, 1500);
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
    <div
      className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-keep-selection]')) return;
        setSelectedSlot(null);
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <IconBack />
          Decks
        </Button>
        <span className="text-xs text-cream-400">
          {savedFlash ? 'Saved' : 'Auto-saves in this browser'}
        </span>
        <div className="ml-auto flex flex-col items-end gap-1">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="gold" onClick={() => void copyLink()}>
              <IconCopy />
              {copyState === 'copied'
                ? 'Copied'
                : copyState === 'error'
                  ? 'Copy failed'
                  : copyState === 'blocked'
                    ? 'Cannot copy'
                    : 'Copy share link'}
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <IconTrash />
              Delete
            </Button>
          </div>
          {copyMessage && (
            <p className="max-w-xs text-right text-xs text-amber-300">{copyMessage}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {(showName || showFolder) && (
          <div
            className={`grid gap-3 ${
              showName && showFolder ? 'md:grid-cols-[minmax(0,1fr)_240px]' : ''
            }`}
          >
            {showName && (
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
            )}
            {showFolder && (
              <div className="block">
                <span className="mb-1 block text-xs font-semibold tracking-wide text-cream-400 uppercase">
                  Folder
                </span>
                <div className="flex gap-2">
                  <select
                    value={deck.folderId ?? ''}
                    onChange={(event) => setDeck({ ...deck, folderId: event.target.value || null })}
                    className="select-field min-w-0 flex-1 rounded-2xl border border-white/10 bg-navy-800 px-3 py-3 text-sm outline-none focus:border-gold-400/50"
                  >
                    <option value="">Unfiled</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    className="px-3"
                    title="Create folder"
                    onClick={() => setNewFolderOpen(true)}
                  >
                    <IconPlus />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {showImport && <ShareLinkField onApply={applyLink} />}
        {showTextMatch && (
          <TextDeckField replacesDeck={filledCount >= DECK_SIZE} onApply={applyText} />
        )}
        {!showTextMatch && textNotice && (
          <p
            className={`text-sm ${
              textNotice.tone === 'ok'
                ? 'text-emerald-300'
                : textNotice.tone === 'warn'
                  ? 'text-amber-300'
                  : 'text-red-300'
            }`}
          >
            {textNotice.message}
          </p>
        )}

        <label className="block max-w-xs">
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
            className="select-field w-full rounded-2xl border border-white/10 bg-navy-800 px-3 py-3 text-sm outline-none focus:border-gold-400/50"
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
        onToggleHero={(index) => {
          const card = getCard(deck.cardIds[index]);
          if (!card?.hasHero) return;
          setDeck(store.toggleDeckHero(deck, index));
        }}
        onSwapSlots={(from, to) => {
          setDeck(store.swapDeckSlots(deck, from, to));
        }}
      />

      <CardPicker selectedIds={deck.cardIds} onPick={placeCard} />

      {newFolderOpen && (
        <Modal
          title="New folder"
          confirmLabel="Create folder"
          onCancel={() => {
            setNewFolderOpen(false);
            setNewFolderName('');
          }}
          onConfirm={() => {
            const name = newFolderName.trim();
            if (!name) return;
            const folder = store.createFolder(name);
            setDeck({ ...deck, folderId: folder.id });
            setNewFolderOpen(false);
            setNewFolderName('');
          }}
        >
          <label className="block">
            <span className="sr-only">Folder name</span>
            <input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="Folder name"
              autoFocus
              className="w-full rounded-2xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm outline-none focus:border-gold-400/50"
            />
          </label>
        </Modal>
      )}

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
