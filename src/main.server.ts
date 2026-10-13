import { mergeApplicationConfig } from '@angular/core';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { RenderMode, provideServerRendering, withRoutes, type ServerRoute } from '@angular/ssr';
import { App, appConfig } from './app';

// Build time only: the two pages are written to HTML files. The *.html
// aliases are served by those same files, so they render in the browser.
const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'ai-radar', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];

const config = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
});

export default (context: BootstrapContext) => bootstrapApplication(App, config, context);
