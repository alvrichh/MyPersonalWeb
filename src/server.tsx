import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { PAGES, type PageName } from './pages';

/** Used at build time by scripts/prerender.mjs to write real HTML into each page. */
export function render(page: PageName) {
  const Page = PAGES[page];
  return renderToString(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
}
