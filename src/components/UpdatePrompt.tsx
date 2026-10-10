import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './ui.tsx';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

function watchForUpdates(swUrl: string, registration: ServiceWorkerRegistration) {
  const check = async () => {
    if (registration.installing || !navigator.onLine) return;
    try {
      // registration.update() rejects when the server is unreachable, so probe the worker script first.
      const response = await fetch(swUrl, { cache: 'no-store' });
      if (response.ok) await registration.update();
    } catch {
      // Offline or the host is down; try again on the next check.
    }
  };

  setInterval(check, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check();
  });
  window.addEventListener('online', () => void check());
}

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (registration) watchForUpdates(swUrl, registration);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-white/10 bg-navy-900 p-4 shadow-xl shadow-black/40 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-cream-50">
          A new version of the app is available. Save any deck you&apos;re editing, then update.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNeedRefresh(false)}>
            Later
          </Button>
          <Button variant="gold" onClick={() => void updateServiceWorker(true)}>
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}
