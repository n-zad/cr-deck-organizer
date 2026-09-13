import { useMemo, useState } from 'react';
import { BackupBar } from '../components/BackupBar.tsx';
import { DeckGrid } from '../components/DeckGrid.tsx';
import { FolderSidebar, type FolderFilter } from '../components/FolderSidebar.tsx';
import { Modal } from '../components/Modal.tsx';
import { Button, IconPlus, IconSearch } from '../components/ui.tsx';
import { navigate } from '../lib/hashRoute.ts';
import { newDraftDeck } from '../lib/appStore.ts';
import { store, useAppState } from '../useAppState.ts';

export function HomePage() {
  const state = useAppState();
  const [filter, setFilter] = useState<FolderFilter>('all');
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const decks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.decks
      .filter((deck) => {
        if (filter === 'unfiled' && deck.folderId != null) return false;
        if (filter !== 'all' && filter !== 'unfiled' && deck.folderId !== filter) return false;
        if (needle && !deck.name.toLowerCase().includes(needle)) return false;
        return true;
      })
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [filter, query, state.decks]);

  const folders = useMemo(
    () => state.folders.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [state.folders],
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-400 uppercase">
            Clash Royale
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-cream-50 sm:text-4xl">
            Deck Organizer
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-cream-400">
            Save decks in this browser, file them into folders, and keep a JSON backup when you
            want a copy elsewhere. Nothing is uploaded.
          </p>
        </div>
        <BackupBar state={state} onRestore={(next) => store.replaceState(next)} />
      </header>

      <div className="grid gap-8 md:grid-cols-[13.5rem_minmax(0,1fr)]">
        <FolderSidebar
          folders={folders}
          selected={filter}
          onSelect={setFilter}
          onCreate={(name) => store.createFolder(name)}
          onRename={(id, name) => store.renameFolder(id, name)}
          onDelete={(id) => setPendingDelete(id)}
        />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Search decks</span>
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cream-400">
                <IconSearch />
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search decks"
                className="w-full rounded-full border border-white/10 bg-navy-900 py-2.5 pr-4 pl-10 text-sm outline-none placeholder:text-cream-400/70 focus:border-gold-400/50"
              />
            </label>
            <Button
              variant="gold"
              onClick={() => {
                const folderId = filter === 'all' || filter === 'unfiled' ? null : filter;
                const created = store.saveDeck(newDraftDeck(folderId));
                navigate(`/deck/${created.id}`);
              }}
            >
              <IconPlus />
              New deck
            </Button>
          </div>
          <DeckGrid
            decks={decks}
            folders={folders}
            emptyTitle={query.trim() ? 'No matching decks' : 'No decks here yet'}
            emptyBody={
              query.trim()
                ? 'Try a different name, or clear the search.'
                : 'Start a new deck or paste a Clash Royale share link.'
            }
          />
        </div>
      </div>

      {pendingDelete && (
        <Modal
          title="Delete this folder?"
          confirmLabel="Delete folder"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            store.deleteFolder(pendingDelete);
            if (filter === pendingDelete) setFilter('all');
            setPendingDelete(null);
          }}
        >
          Decks inside it stay in your library and move to Unfiled. Only the folder is removed.
        </Modal>
      )}
    </div>
  );
}
