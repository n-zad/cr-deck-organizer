import { HomePage } from './pages/HomePage.tsx';
import { DeckEditorPage } from './pages/DeckEditorPage.tsx';
import { parseRoute, useHashRoute } from './lib/hashRoute.ts';

export default function App() {
  const path = useHashRoute();
  const route = parseRoute(path);

  if (route.name === 'new') {
    return <DeckEditorPage />;
  }
  if (route.name === 'deck') {
    return <DeckEditorPage deckId={route.id} />;
  }
  return <HomePage />;
}
