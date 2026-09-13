import { useRef, useState } from 'react';
import { backupFileName, parseBackup, serializeBackup } from '../lib/backup.ts';
import type { AppState } from '../lib/types.ts';
import { Modal } from './Modal.tsx';
import { Button, IconDownload, IconUpload } from './ui.tsx';

type BackupBarProps = {
  state: AppState;
  onRestore: (state: AppState) => void;
};

export function BackupBar({ state, onRestore }: BackupBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);

  function exportFile(): void {
    const blob = new Blob([serializeBackup(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(file: File | undefined): Promise<void> {
    if (!file) return;
    const text = await file.text();
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setPending(parsed.value);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={exportFile}>
        <IconDownload />
        Export backup
      </Button>
      <Button variant="ghost" onClick={() => inputRef.current?.click()}>
        <IconUpload />
        Restore
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {error && <p className="text-sm text-red-300">{error}</p>}
      {pending && (
        <Modal
          title="Replace local decks?"
          confirmLabel="Restore backup"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() => {
            onRestore(pending);
            setPending(null);
          }}
        >
          This replaces every deck and folder currently in this browser with the
          {` ${pending.decks.length} `}
          deck{pending.decks.length === 1 ? '' : 's'} from the backup file.
        </Modal>
      )}
    </div>
  );
}
