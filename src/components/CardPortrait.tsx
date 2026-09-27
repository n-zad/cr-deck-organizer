import type { DragEvent, DragEventHandler, PointerEventHandler } from 'react';
import { assetUrl } from '../lib/catalog.ts';
import type { CardFrame } from '../lib/deck.ts';
import type { CatalogCard } from '../lib/types.ts';

const rarityGlow: Record<CatalogCard['rarity'], string> = {
  common: 'drop-shadow-[0_0_6px_rgba(230,240,255,0.85)]',
  rare: 'drop-shadow-[0_0_7px_rgba(255,140,50,0.9)]',
  epic: 'drop-shadow-[0_0_7px_rgba(168,85,247,0.9)]',
  legendary: 'drop-shadow-[0_0_7px_rgba(45,212,191,0.95)]',
  champion: 'drop-shadow-[0_0_8px_rgba(240,180,41,0.95)]',
};

const frameGlow: Record<Exclude<CardFrame, 'none'>, string> = {
  evo: 'drop-shadow-[0_0_12px_rgba(217,70,239,1)] drop-shadow-[0_0_4px_rgba(192,38,211,1)]',
  hero: 'drop-shadow-[0_0_12px_rgba(255,213,74,1)] drop-shadow-[0_0_4px_rgba(250,204,21,1)]',
  champion: 'drop-shadow-[0_0_12px_rgba(255,213,74,1)] drop-shadow-[0_0_4px_rgba(250,204,21,1)]',
};

const neonBorder: Record<Exclude<CardFrame, 'none'>, string> = {
  evo: 'ring-2 ring-fuchsia-400 shadow-[0_0_12px_#d946ef,inset_0_0_8px_rgba(217,70,239,0.55)]',
  hero: 'ring-2 ring-amber-300 shadow-[0_0_12px_#ffd54a,inset_0_0_8px_rgba(255,213,74,0.45)]',
  champion: 'ring-2 ring-amber-300 shadow-[0_0_12px_#ffd54a,inset_0_0_8px_rgba(255,213,74,0.45)]',
};

type Size = 'xs' | 'sm' | 'md';

const sizeClass: Record<Size, string> = {
  xs: 'w-12 sm:w-14',
  sm: 'w-16',
  md: 'w-[4.6rem] sm:w-24',
};

type CardPortraitProps = {
  card?: CatalogCard;
  size?: Size;
  widthPx?: number;
  dimmed?: boolean;
  frame?: CardFrame;
  warning?: boolean;
  neon?: boolean;
  showElixir?: boolean;
  onClick?: () => void;
  label?: string;
  draggable?: boolean;
  onDragStart?: DragEventHandler<HTMLElement>;
  onDragEnd?: DragEventHandler<HTMLElement>;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDragLeave?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onPointerMove?: PointerEventHandler<HTMLElement>;
  onPointerUp?: PointerEventHandler<HTMLElement>;
  onPointerCancel?: PointerEventHandler<HTMLElement>;
};

function sizeFromWidth(widthPx: number): Size {
  if (widthPx <= 52) return 'xs';
  if (widthPx <= 72) return 'sm';
  return 'md';
}

/** Snapshot the portrait bitmap so the first drag is not an empty ghost. */
function setPortraitDragImage(event: DragEvent<HTMLElement>): void {
  const img = event.currentTarget.querySelector('img');
  if (!img || !img.complete || img.naturalWidth === 0) return;
  const shown = img.getBoundingClientRect();
  const width = Math.max(1, Math.round(shown.width));
  const height = Math.max(1, Math.round(shown.height));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, width, height);
  canvas.style.cssText =
    'position:fixed;left:-9999px;top:0;width:0;height:0;pointer-events:none;opacity:0';
  document.body.appendChild(canvas);
  event.dataTransfer.setDragImage(canvas, width / 2, height / 2);
  window.setTimeout(() => canvas.remove(), 0);
}

export function CardPortrait({
  card,
  size = 'sm',
  widthPx,
  dimmed = false,
  frame = 'none',
  warning = false,
  neon = false,
  showElixir = true,
  onClick,
  label,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CardPortraitProps) {
  const resolvedSize = widthPx != null ? sizeFromWidth(widthPx) : size;
  const className = [
    'relative block overflow-visible transition',
    widthPx == null ? sizeClass[size] : '',
    dimmed ? 'opacity-35' : '',
    onClick ? 'hover:-translate-y-0.5 hover:brightness-110' : '',
    draggable || onPointerDown ? 'cursor-grab touch-none active:cursor-grabbing' : '',
  ].join(' ');

  const imageClass = [
    'pointer-events-none block h-auto w-full rounded-[13%]',
    frame !== 'none' ? frameGlow[frame] : card ? rarityGlow[card.rarity] : '',
  ].join(' ');

  const showTabs = Boolean(card && (card.hasEvolution || card.hasHero));
  const lit = neon && frame !== 'none';
  const neonInsetX =
    resolvedSize === 'xs'
      ? '-inset-x-[8%]'
      : resolvedSize === 'md'
        ? '-inset-x-[3%]'
        : '-inset-x-[5%]';
  const widthStyle = widthPx != null ? { width: widthPx } : undefined;

  const content = (
    <>
      {card ? (
        <span className="relative block">
          {lit && (
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-y-0 ${neonInsetX} rounded-[13%] ${neonBorder[frame]}`}
            />
          )}
          <img src={assetUrl(card.image)} alt="" draggable={false} className={imageClass} />
        </span>
      ) : (
        <span className="flex aspect-[285/420] w-full items-center justify-center rounded-[13%] bg-navy-700 text-lg text-cream-400/40 ring-1 ring-white/10">
          +
        </span>
      )}
      {showTabs && (
        <VariantTabs
          hasEvo={card!.hasEvolution}
          hasHero={card!.hasHero}
          size={resolvedSize}
        />
      )}
      {card && showElixir && <ElixirBadge cost={card.elixir} size={resolvedSize} />}
      {warning && (
        <span
          className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-navy-950 shadow-md"
          title="This form is not in a legal slot"
        >
          !
        </span>
      )}
    </>
  );

  const dragProps = {
    draggable,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      if (draggable) setPortraitDragImage(event);
      onDragStart?.(event);
    },
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };

  if (!onClick) {
    return (
      <div className={className} style={widthStyle} {...dragProps}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={widthStyle}
      aria-label={label ?? (card ? card.name : 'Empty slot')}
      title={card?.name}
      {...dragProps}
    >
      {content}
    </button>
  );
}

function VariantTabs({
  hasEvo,
  hasHero,
  size,
}: {
  hasEvo: boolean;
  hasHero: boolean;
  size: Size;
}) {
  // Champion gold pip is ~13% of the 285px art; tabs are a bit wider to include the frame.
  const width = size === 'xs' ? 12 : size === 'sm' ? 17 : 24;
  const height = size === 'xs' ? 11 : size === 'sm' ? 15 : 20;
  return (
    <span
      className="pointer-events-none absolute top-[15.9%] left-1/2 z-10 flex -translate-x-1/2 -translate-y-[92%]"
      aria-hidden="true"
    >
      {hasEvo && <GemTab tone="evo" width={width} height={height} />}
      {hasHero && <GemTab tone="hero" width={width} height={height} />}
    </span>
  );
}

function GemTab({
  tone,
  width,
  height,
}: {
  tone: 'evo' | 'hero';
  width: number;
  height: number;
}) {
  const tab = tone === 'evo' ? '#6b21a8' : '#9a7418';
  const gem = tone === 'evo' ? '#e879f9' : '#ffe082';
  const shine = tone === 'evo' ? '#f5d0fe' : '#fff8e1';
  return (
    <svg width={width} height={height} viewBox="0 0 20 16" aria-hidden="true">
      <path d="M1.1 16V5.2A3.8 3.8 0 0 1 4.9 1.5h10.2A3.8 3.8 0 0 1 18.9 5.2V16Z" fill={tab} />
      <path d="M10 3.2 14.8 8.2 10 13.2 5.2 8.2Z" fill={gem} />
      <path d="M10 4.1 13 7.3 10 8.2 7 7.3Z" fill={shine} opacity="0.7" />
    </svg>
  );
}

function ElixirBadge({ cost, size }: { cost: number | null; size: Size }) {
  const dim = size === 'xs' ? 16 : size === 'sm' ? 22 : 26;
  const text = size === 'xs' ? 'text-[8px]' : size === 'sm' ? 'text-[11px]' : 'text-xs';
  const offset =
    size === 'md' ? 'translate-y-1/4' : '-translate-x-[25%] translate-y-[18%]';
  return (
    <span
      className={`absolute top-0 left-0 z-20 flex items-center justify-center ${offset}`}
      style={{ width: dim, height: Math.round(dim * 1.2) }}
    >
      <svg viewBox="0 0 24 29" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M12 1.4C12 1.4 3.2 11.2 3.2 17.6a8.8 8.8 0 1 0 17.6 0C20.8 11.2 12 1.4 12 1.4Z"
          fill="#6b1548"
        />
        <path
          d="M12 3.1C12 3.1 4.7 11.6 4.7 17.3a7.3 7.3 0 1 0 14.6 0C19.3 11.6 12 3.1 12 3.1Z"
          fill="#e0409a"
        />
        <path
          d="M12 5.2C12 5.2 6.4 12.2 6.4 16.8a5.6 5.6 0 1 0 11.2 0C17.6 12.2 12 5.2 12 5.2Z"
          fill="#f472b6"
        />
        <ellipse cx="9.4" cy="12.2" rx="2.1" ry="3.1" fill="#fce7f3" opacity="0.6" />
      </svg>
      <span
        className={`relative mt-1 font-bold text-white ${text}`}
        style={{ textShadow: '0 1px 2px rgba(80,10,40,0.85)' }}
      >
        {cost ?? '?'}
      </span>
    </span>
  );
}
