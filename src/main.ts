import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, TitleStrategy } from '@angular/router';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { AuthService } from './app/services/auth.service';
import { TemplatePageTitleStrategy } from './app/title.strategy';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    // Use route 'title' values for the browser tab title
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
  ],
}).then(appRef => {
  // Best-effort preload: does not block UI
  const auth = appRef.injector.get(AuthService);
  auth.initFromRefresh();
});
