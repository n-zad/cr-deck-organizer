import type { ReactNode } from 'react';
import { IconClose } from './ui.tsx';

type ModalProps = {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function Modal({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-navy-800 p-5 shadow-2xl shadow-black/40"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="modal-title" className="text-lg font-semibold text-cream-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-cream-400 hover:bg-white/5 hover:text-cream-50"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div className="text-sm leading-6 text-cream-200">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm text-cream-200 hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-gold-400 text-navy-950 hover:bg-gold-300'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
