import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal.tsx';
import { Button, IconBack, IconPlus, IconTrash } from '../components/ui.tsx';
import { navigate } from '../lib/hashRoute.ts';
import { store, useAppState } from '../useAppState.ts';

export function FoldersPage() {
  const state = useAppState();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const folders = useMemo(
    () => state.folders.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [state.folders],
  );

  function submitNew(): void {
    const name = draft.trim();
    if (!name) return;
    store.createFolder(name);
    setDraft('');
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <IconBack />
          Decks
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold tracking-[0.22em] text-gold-400 uppercase">Library</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-cream-50">Folders</h1>
        <p className="mt-2 text-sm leading-6 text-cream-400">
          Add, rename, or delete folders. Decks inside a deleted folder move to Unfiled.
        </p>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitNew();
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="New folder name"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-navy-900 px-4 py-2.5 text-sm outline-none placeholder:text-cream-400/60 focus:border-gold-400/50"
        />
        <Button type="submit" variant="gold">
          <IconPlus />
          Add folder
        </Button>
      </form>

      <section className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-navy-800/70 p-3">
        {folders.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-cream-400">
            No folders yet. Add one above, or create one while editing a deck.
          </p>
        )}
        {folders.map((folder) => {
          const deckCount = state.decks.filter((deck) => deck.folderId === folder.id).length;
          return (
            <div
              key={folder.id}
              className="flex items-center gap-2 rounded-xl bg-navy-900/70 px-3 py-2"
            >
              {editingId === folder.id ? (
                <form
                  className="min-w-0 flex-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    store.renameFolder(folder.id, editingName);
                    setEditingId(null);
                  }}
                >
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="w-full rounded-full border border-gold-400/40 bg-navy-800 px-3 py-1.5 text-sm outline-none"
                    autoFocus
                  />
                </form>
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-cream-50">{folder.name}</div>
                  <div className="text-xs text-cream-400">
                    {deckCount} {deckCount === 1 ? 'deck' : 'decks'}
                  </div>
                </div>
              )}
              {editingId === folder.id ? (
                <Button
                  variant="gold"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    store.renameFolder(folder.id, editingName);
                    setEditingId(null);
                  }}
                >
                  Save
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    setEditingId(folder.id);
                    setEditingName(folder.name);
                  }}
                >
                  Rename
                </Button>
              )}
              <button
                type="button"
                title="Delete folder"
                onClick={() => setPendingDelete(folder.id)}
                className="rounded-full p-1.5 text-cream-400 hover:bg-white/5 hover:text-red-200"
              >
                <IconTrash />
              </button>
            </div>
          );
        })}
      </section>

      {pendingDelete && (
        <Modal
          title="Delete this folder?"
          confirmLabel="Delete folder"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            store.deleteFolder(pendingDelete);
            setPendingDelete(null);
            if (editingId === pendingDelete) setEditingId(null);
          }}
        >
          Decks inside it stay in your library and move to Unfiled. Only the folder is removed.
        </Modal>
      )}
    </div>
  );
}
