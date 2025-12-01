import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';

import { routes } from './app.routes';
import { InMemoryDataService } from './services/in-memory-data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(
      HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, {
        delay: 0,
        passThruUnknownUrl: true
      })
    )
  ]
};
