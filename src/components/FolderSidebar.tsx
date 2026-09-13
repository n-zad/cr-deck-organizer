import { useState } from 'react';
import type { Folder } from '../lib/types.ts';
import { Button, IconFolder, IconPlus, IconTrash } from './ui.tsx';

export type FolderFilter = 'all' | 'unfiled' | string;

type FolderSidebarProps = {
  folders: Folder[];
  selected: FolderFilter;
  onSelect: (filter: FolderFilter) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export function FolderSidebar({
  folders,
  selected,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: FolderSidebarProps) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  function submitNew(): void {
    const name = draft.trim();
    if (!name) return;
    onCreate(name);
    setDraft('');
  }

  return (
    <aside className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-cream-400 uppercase">
        <IconFolder />
        Folders
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
        <FolderChip active={selected === 'all'} onClick={() => onSelect('all')}>
          All decks
        </FolderChip>
        <FolderChip active={selected === 'unfiled'} onClick={() => onSelect('unfiled')}>
          Unfiled
        </FolderChip>
        {folders.map((folder) => (
          <div key={folder.id} className="flex min-w-fit items-center gap-1">
            {editingId === folder.id ? (
              <form
                className="flex items-center gap-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  onRename(folder.id, editingName);
                  setEditingId(null);
                }}
              >
                <input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  className="w-32 rounded-full border border-gold-400/40 bg-navy-900 px-3 py-1.5 text-sm outline-none"
                  autoFocus
                />
              </form>
            ) : (
              <FolderChip
                active={selected === folder.id}
                onClick={() => onSelect(folder.id)}
                onDoubleClick={() => {
                  setEditingId(folder.id);
                  setEditingName(folder.name);
                }}
              >
                {folder.name}
              </FolderChip>
            )}
            <button
              type="button"
              title="Delete folder"
              onClick={() => onDelete(folder.id)}
              className="rounded-full p-1.5 text-cream-400 hover:bg-white/5 hover:text-red-200"
            >
              <IconTrash />
            </button>
          </div>
        ))}
      </nav>
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
          placeholder="New folder"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-navy-900 px-3 py-2 text-sm outline-none placeholder:text-cream-400/60 focus:border-gold-400/50"
        />
        <Button type="submit" variant="ghost" className="px-3" title="Create folder">
          <IconPlus />
        </Button>
      </form>
    </aside>
  );
}

function FolderChip({
  active,
  children,
  onClick,
  onDoubleClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  onDoubleClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`self-start rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition ${
        active
          ? 'bg-gold-400 text-navy-950 font-semibold'
          : 'bg-navy-800 text-cream-200 hover:bg-navy-700'
      }`}
    >
      {children}
    </button>
  );
}
