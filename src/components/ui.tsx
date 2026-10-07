import type { ReactNode } from 'react';

export function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.5 16.5 20 20" strokeLinecap="round" />
    </svg>
  );
}

export function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4v12" strokeLinecap="round" />
      <path d="m7 12 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20V8" strokeLinecap="round" />
      <path d="m7 12 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 4h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export function IconExternal() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4 11 13" strokeLinecap="round" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconBack() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 7h14" strokeLinecap="round" />
      <path d="M10 7V5h4v2" />
      <path d="M8 7l1 13h6l1-13" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13.5a7.7 7.7 0 0 0 .1-1.5 7.7 7.7 0 0 0-.1-1.5l2-1.5-2-3.5-2.3.7a7.4 7.4 0 0 0-2.6-1.5L14 2h-4l-.5 2.7a7.4 7.4 0 0 0-2.6 1.5l-2.3-.7-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1.5 7.7 7.7 0 0 0 .1 1.5l-2 1.5 2 3.5 2.3-.7a7.4 7.4 0 0 0 2.6 1.5L10 22h4l.5-2.7a7.4 7.4 0 0 0 2.6-1.5l2.3.7 2-3.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconReverse() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 7h11M7 7l3-3M7 7l3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 17H6M17 17l-3-3M17 17l-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chip({
  active,
  children,
  onClick,
  title,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? 'bg-gold-400 text-navy-950' : 'bg-navy-900 text-cream-300 hover:bg-navy-700'
      }`}
    >
      {children}
    </button>
  );
}

export function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />
    </svg>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost' | 'danger' | 'gold';
  className?: string;
  disabled?: boolean;
  title?: string;
};

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-navy-700 text-cream-50 hover:bg-navy-600 border-white/10 disabled:opacity-40',
  ghost:
    'bg-transparent text-cream-200 hover:bg-white/5 border-transparent disabled:opacity-40',
  danger:
    'bg-red-500/10 text-red-200 hover:bg-red-500/20 border-red-400/20 disabled:opacity-40',
  gold:
    'bg-gold-400 text-navy-950 hover:bg-gold-300 border-gold-400 font-semibold disabled:opacity-80',
};

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled,
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-3.5 py-2 text-sm transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
