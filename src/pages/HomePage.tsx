import { useEffect, useMemo, useState } from 'react';
import { BackupBar } from '../components/BackupBar.tsx';
import { DeckGrid } from '../components/DeckGrid.tsx';
import { FolderSidebar, type FolderFilter } from '../components/FolderSidebar.tsx';
import { Button, Chip, IconPlus, IconReverse, IconSearch, IconSettings } from '../components/ui.tsx';
import { cardsFromIds } from '../lib/catalog.ts';
import { navigate } from '../lib/hashRoute.ts';
import { newDraftDeck } from '../lib/appStore.ts';
import { sortDecks, type DeckSortKey } from '../lib/sort.ts';
import { store, useAppState } from '../useAppState.ts';

const DECK_SORTS: Array<{ id: DeckSortKey; label: string }> = [
  { id: 'updated', label: 'Last modified' },
  { id: 'created', label: 'Date created' },
  { id: 'name', label: 'A–Z' },
  { id: 'elixir', label: 'Avg elixir' },
];

/** Survives leaving for the editor and coming back, but not a reload. */
let rememberedFilter: FolderFilter = 'all';

export function HomePage() {
  const state = useAppState();
  const [selectedFilter, setSelectedFilter] = useState<FolderFilter>(rememberedFilter);
  const filter =
    selectedFilter === 'all' ||
    selectedFilter === 'unfiled' ||
    state.folders.some((folder) => folder.id === selectedFilter)
      ? selectedFilter
      : 'all';
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<DeckSortKey>('updated');
  const [sortReverse, setSortReverse] = useState(false);

  useEffect(() => {
    if (state.settings.autoDeleteEmptyDecks) {
      store.pruneEmptyDecks();
    }
  }, [state.settings.autoDeleteEmptyDecks]);

  const decks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = state.decks.filter((deck) => {
      if (!state.settings.ignoreFolders) {
        if (filter === 'unfiled' && deck.folderId != null) return false;
        if (filter !== 'all' && filter !== 'unfiled' && deck.folderId !== filter) return false;
      }
      if (needle && !deck.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    return sortDecks(filtered, sortKey, sortReverse, (deck) => cardsFromIds(deck.cardIds));
  }, [filter, query, sortKey, sortReverse, state.decks, state.settings.ignoreFolders]);

  const folderCounts = useMemo(() => {
    const counts = new Map<FolderFilter, number>([
      ['all', state.decks.length],
      ['unfiled', 0],
    ]);
    for (const deck of state.decks) {
      const key = deck.folderId ?? 'unfiled';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [state.decks]);

  function selectFilter(next: FolderFilter): void {
    rememberedFilter = next;
    setSelectedFilter(next);
  }

  return (
    <div className="mx-auto flex max-w-[100rem] flex-col gap-8 px-4 py-8 sm:px-6 xl:px-50">
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
        <div className="flex flex-wrap items-center justify-end gap-1.5 self-end">
          <Button variant="ghost" onClick={() => navigate('/settings')}>
            <IconSettings />
            Settings
          </Button>
          <BackupBar state={state} onRestore={(next) => store.replaceState(next)} />
        </div>
      </header>

      <div className="flex flex-col gap-6">
        {!state.settings.ignoreFolders && (
          <FolderSidebar
            folders={state.folders}
            counts={folderCounts}
            selected={filter}
            onSelect={selectFilter}
            onManage={() => navigate('/folders')}
          />
        )}
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
                const folderId =
                  state.settings.ignoreFolders || filter === 'all' || filter === 'unfiled'
                    ? null
                    : filter;
                const created = store.saveDeck(
                  newDraftDeck(folderId, state.settings.defaultTowerTroopId),
                );
                navigate(`/deck/${created.id}`);
              }}
            >
              <IconPlus />
              New deck
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DECK_SORTS.map((item) => (
              <Chip key={item.id} active={sortKey === item.id} onClick={() => setSortKey(item.id)}>
                {item.label}
              </Chip>
            ))}
            <Chip
              active={sortReverse}
              title={sortReverse ? 'Show original order' : 'Reverse order'}
              onClick={() => setSortReverse((current) => !current)}
            >
              <IconReverse />
              Reverse
            </Chip>
            <span className="ml-auto text-xs text-cream-400" aria-live="polite">
              {decks.length === state.decks.length
                ? `${decks.length} ${decks.length === 1 ? 'deck' : 'decks'}`
                : `Showing ${decks.length} of ${state.decks.length} ${state.decks.length === 1 ? 'deck' : 'decks'}`}
            </span>
          </div>
          <DeckGrid
            decks={decks}
            folders={state.folders}
            hideNames={state.settings.hideDeckNames}
            hideFolders={state.settings.ignoreFolders}
            emptyTitle={query.trim() ? 'No matching decks' : 'No decks here yet'}
            emptyBody={
              query.trim()
                ? 'Try a different name, or clear the search.'
                : 'Start a new deck or paste a Clash Royale share link.'
            }
          />
        </div>
      </div>

    </div>
  );
}
