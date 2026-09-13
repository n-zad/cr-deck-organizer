import { assetUrl } from '../lib/catalog.ts';
import type { CatalogCard } from '../lib/types.ts';

const rarityRing: Record<CatalogCard['rarity'], string> = {
  common: 'ring-rarity-common/70',
  rare: 'ring-rarity-rare/80',
  epic: 'ring-rarity-epic/80',
  legendary: 'ring-rarity-legendary/90',
  champion: 'ring-rarity-champion/90',
};

type Size = 'xs' | 'sm' | 'md';

const sizeClass: Record<Size, string> = {
  xs: 'w-9 sm:w-10',
  sm: 'w-16',
  md: 'w-[4.6rem] sm:w-24',
};

type CardPortraitProps = {
  card?: CatalogCard;
  size?: Size;
  selected?: boolean;
  dimmed?: boolean;
  evolved?: boolean;
  showElixir?: boolean;
  onClick?: () => void;
  label?: string;
};

export function CardPortrait({
  card,
  size = 'sm',
  selected = false,
  dimmed = false,
  evolved = false,
  showElixir = true,
  onClick,
  label,
}: CardPortraitProps) {
  const className = [
    'relative aspect-[5/6] overflow-hidden rounded-xl bg-navy-700 ring-1 transition',
    sizeClass[size],
    card ? rarityRing[card.rarity] : 'ring-white/10',
    selected ? 'ring-2 ring-gold-300 ring-offset-2 ring-offset-navy-950' : '',
    dimmed ? 'opacity-35' : '',
    onClick ? 'hover:-translate-y-0.5 hover:brightness-110' : '',
  ].join(' ');

  const content = (
    <>
      {card ? (
        <img
          src={assetUrl(card.image)}
          alt=""
          draggable={false}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <span className="flex h-full items-center justify-center text-lg text-cream-400/40">+</span>
      )}
      {card && showElixir && (
        <span className="absolute top-1 left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-navy-950/80 px-1 text-[11px] font-semibold text-cream-50">
          {card.elixir ?? '?'}
        </span>
      )}
      {evolved && (
        <span className="absolute right-1 bottom-1 rounded-full bg-gold-400 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-navy-950 uppercase">
          Evo
        </span>
      )}
    </>
  );

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={label ?? (card ? card.name : 'Empty slot')}
      title={card?.name}
    >
      {content}
    </button>
  );
}
