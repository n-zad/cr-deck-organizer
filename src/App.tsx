import { useEffect } from 'react';
import { FanContentNotice } from './components/FanContentNotice.tsx';
import { UpdatePrompt } from './components/UpdatePrompt.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { DeckEditorPage } from './pages/DeckEditorPage.tsx';
import { FoldersPage } from './pages/FoldersPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { VariantsPage } from './pages/VariantsPage.tsx';
import { parseRoute, useHashRoute, type Route } from './lib/hashRoute.ts';

function routeScrollKey(route: Route): string {
  if (route.name === 'new' || route.name === 'deck') return 'editor';
  return route.name;
}

export default function App() {
  const path = useHashRoute();
  const route = parseRoute(path);
  const scrollKey = routeScrollKey(route);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [scrollKey]);

  let page = <HomePage />;
  if (route.name === 'settings') {
    page = <SettingsPage />;
  } else if (route.name === 'variants') {
    page = <VariantsPage />;
  } else if (route.name === 'folders') {
    page = <FoldersPage />;
  } else if (route.name === 'new') {
    page = <DeckEditorPage />;
  } else if (route.name === 'deck') {
    page = <DeckEditorPage deckId={route.id} />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">{page}</div>
      <footer className="border-t border-white/8 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <FanContentNotice />
        </div>
      </footer>
      <UpdatePrompt />
    </div>
  );
}
