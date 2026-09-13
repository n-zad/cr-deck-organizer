import { useCallback, useEffect, useState } from 'react';

export function currentHashPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || hash === '/') return '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

export function navigate(path: string, replace = false): void {
  const next = path.startsWith('#') ? path.slice(1) : path;
  const normalized = next.startsWith('/') ? next : `/${next}`;
  const hash = `#${normalized === '/' ? '/' : normalized}`;
  if (replace) {
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = hash;
}

export function useHashRoute(): string {
  const [path, setPath] = useState(currentHashPath);

  const onChange = useCallback(() => {
    setPath(currentHashPath());
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', onChange);
    if (!window.location.hash) {
      navigate('/', true);
    }
    return () => window.removeEventListener('hashchange', onChange);
  }, [onChange]);

  return path;
}

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'deck'; id: string };

export function parseRoute(path: string): Route {
  if (path === '/new') return { name: 'new' };
  const match = path.match(/^\/deck\/([^/]+)$/);
  if (match) return { name: 'deck', id: decodeURIComponent(match[1]) };
  return { name: 'home' };
}
