import {
  averageElixir,
  cardFrame,
  filledCardIds,
  formatElixir,
  isLegalFormSlot,
} from '../lib/deck.ts';
import { cardsFromIds, getTowerTroop, isChampionCard } from '../lib/catalog.ts';
import { navigate } from '../lib/hashRoute.ts';
import { DECK_TILE_CARD, DECK_TILE_CARD_GAP, deckListLayout } from '../lib/layout.ts';
import { ownedFormActive, variantTabOff } from '../lib/settings.ts';
import { useElementWidth } from '../lib/useElementWidth.ts';
import type { Deck, Folder } from '../lib/types.ts';
import { useAppState } from '../useAppState.ts';
import { CardPortrait } from './CardPortrait.tsx';

type DeckTileProps = {
  deck: Deck;
  folderName?: string;
  hideName?: boolean;
  hideFolder?: boolean;
};

export function DeckTile({ deck, folderName, hideName = false, hideFolder = false }: DeckTileProps) {
  const settings = useAppState().settings;
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
      <div
        className="mx-auto mb-3 grid grid-cols-4"
        style={{ width: 'max-content', gap: DECK_TILE_CARD_GAP }}
      >
        {deck.cardIds.map((_, index) => {
          const card = cards[index];
          const evolved = ownedFormActive(
            settings,
            card,
            'evolution',
            deck.evolutionSlots[index] === true,
          );
          const heroForm = ownedFormActive(settings, card, 'hero', deck.heroSlots?.[index] === true);
          const frame = card ? cardFrame(evolved, heroForm, isChampionCard(card)) : 'none';
          return (
            <CardPortrait
              key={`${deck.id}-${index}`}
              card={card}
              size="xs"
              widthPx={DECK_TILE_CARD}
              frame={frame}
              neon={frame !== 'none' && isLegalFormSlot(index, frame)}
              evoOff={card ? variantTabOff(settings, card.id, 'evolution') : false}
              heroOff={card ? variantTabOff(settings, card.id, 'hero') : false}
            />
          );
        })}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {!hideName && (
            <h3 className="truncate font-semibold text-cream-50 group-hover:text-gold-300">
              {deck.name}
            </h3>
          )}
          {(!hideFolder || tower) && (
            <p className={`text-xs text-cream-400 ${hideName ? '' : 'mt-0.5'}`}>
              {hideFolder ? '' : (folderName ?? 'Unfiled')}
              {!hideFolder && tower ? ' · ' : ''}
              {tower ? tower.name : ''}
            </p>
          )}
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
  hideNames?: boolean;
  hideFolders?: boolean;
};

export function DeckGrid({
  decks,
  folders,
  emptyTitle = 'No decks here yet',
  emptyBody = 'Start a new deck or paste a Clash Royale share link.',
  hideNames = false,
  hideFolders = false,
}: DeckGridProps) {
  const folderNames = new Map(folders.map((folder) => [folder.id, folder.name]));
  const [areaRef, areaWidth] = useElementWidth<HTMLDivElement>();
  const layout = deckListLayout(areaWidth);

  if (decks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="font-medium text-cream-50">{emptyTitle}</p>
        <p className="mt-1 text-sm text-cream-400">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div ref={areaRef} className="w-full">
      <div
        className="flex flex-wrap"
        style={{ gap: layout.gapPx, justifyContent: layout.justify }}
      >
        {decks.map((deck) => (
          <div key={deck.id} style={{ width: layout.tileWidth }}>
            <DeckTile
              deck={deck}
              folderName={deck.folderId ? folderNames.get(deck.folderId) : undefined}
              hideName={hideNames}
              hideFolder={hideFolders}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
