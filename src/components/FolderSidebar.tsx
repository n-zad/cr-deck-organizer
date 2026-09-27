import type { Folder } from '../lib/types.ts';
import { Button } from './ui.tsx';

export type FolderFilter = 'all' | 'unfiled' | string;

type FolderSidebarProps = {
  folders: Folder[];
  selected: FolderFilter;
  onSelect: (filter: FolderFilter) => void;
  onManage: () => void;
};

export function FolderSidebar({ folders, selected, onSelect, onManage }: FolderSidebarProps) {
  return (
    <aside className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold tracking-[0.18em] text-cream-400 uppercase">
          Folders
        </div>
        <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={onManage}>
          Manage
        </Button>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
        <FolderChip active={selected === 'all'} onClick={() => onSelect('all')}>
          All decks
        </FolderChip>
        <FolderChip active={selected === 'unfiled'} onClick={() => onSelect('unfiled')}>
          Unfiled
        </FolderChip>
        {folders.map((folder) => (
          <FolderChip
            key={folder.id}
            active={selected === folder.id}
            onClick={() => onSelect(folder.id)}
          >
            {folder.name}
          </FolderChip>
        ))}
      </nav>
    </aside>
  );
}

function FolderChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
