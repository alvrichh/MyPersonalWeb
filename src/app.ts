import { ApplicationConfig, ChangeDetectionStrategy, Component, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { RouterOutlet, provideRouter, type Routes } from '@angular/router';
import { AiRadarPage, HomePage } from './pages/pages';

// Two prerendered pages. The *.html paths are the old URLs the site has always
// used; they render the same pages so links and bookmarks keep working.
export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'index.html', component: HomePage },
  { path: 'ai-radar', component: AiRadarPage },
  { path: 'ai-radar.html', component: AiRadarPage },
  { path: '**', redirectTo: '' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
  ],
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class App {}
