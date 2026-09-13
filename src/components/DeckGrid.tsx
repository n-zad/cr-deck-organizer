import { averageElixir, filledCardIds, formatElixir } from '../lib/deck.ts';
import { cardsFromIds, getTowerTroop } from '../lib/catalog.ts';
import { navigate } from '../lib/hashRoute.ts';
import type { Deck, Folder } from '../lib/types.ts';
import { CardPortrait } from './CardPortrait.tsx';

type DeckTileProps = {
  deck: Deck;
  folderName?: string;
};

export function DeckTile({ deck, folderName }: DeckTileProps) {
  const cards = cardsFromIds(deck.cardIds);
  const elixir = averageElixir(cards.filter(Boolean));
  const filled = filledCardIds(deck.cardIds).length;
  const tower = getTowerTroop(deck.towerTroopId);

  return (
    <button
      type="button"
      onClick={() => navigate(`/deck/${deck.id}`)}
      className="group w-full rounded-2xl border border-white/8 bg-navy-800/80 p-3 text-left shadow-lg shadow-black/20 transition hover:border-gold-400/40 hover:bg-navy-700/80"
    >
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {deck.cardIds.map((_, index) => (
          <CardPortrait
            key={`${deck.id}-${index}`}
            card={cards[index]}
            size="xs"
            showElixir={false}
            evolved={deck.evolutionSlots[index] === true}
          />
        ))}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-cream-50 group-hover:text-gold-300">
            {deck.name}
          </h3>
          <p className="mt-0.5 text-xs text-cream-400">
            {folderName ?? 'Unfiled'}
            {tower ? ` · ${tower.name}` : ''}
          </p>
        </div>
        <div className="text-right text-xs text-cream-400">
          <div className="font-medium text-cream-200">{formatElixir(elixir)} elixir</div>
          <div>{filled}/8 cards</div>
        </div>
      </div>
    </button>
  );
}

type DeckGridProps = {
  decks: Deck[];
  folders: Folder[];
  emptyTitle?: string;
  emptyBody?: string;
};

export function DeckGrid({
  decks,
  folders,
  emptyTitle = 'No decks here yet',
  emptyBody = 'Start a new deck or paste a Clash Royale share link.',
}: DeckGridProps) {
  const folderNames = new Map(folders.map((folder) => [folder.id, folder.name]));
  if (decks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="font-medium text-cream-50">{emptyTitle}</p>
        <p className="mt-1 text-sm text-cream-400">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {decks.map((deck) => (
        <DeckTile
          key={deck.id}
          deck={deck}
          folderName={deck.folderId ? folderNames.get(deck.folderId) : undefined}
        />
      ))}
    </div>
  );
}
