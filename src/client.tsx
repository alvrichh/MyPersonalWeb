import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { PAGES, type PageName } from './pages';
import './styles/main.scss';

// Each HTML page says which React page it holds: <div id="root" data-page="home">.
// In production the markup is already there (prerendered), so React hydrates
// it; in development it renders from scratch.
const container = document.getElementById('root');

if (container) {
  const Page = PAGES[(container.dataset.page as PageName) ?? 'home'] ?? PAGES.home;
  const app = (
    <StrictMode>
      <Page />
    </StrictMode>
  );
  if (container.firstElementChild) hydrateRoot(container, app);
  else createRoot(container).render(app);
}
