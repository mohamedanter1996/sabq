import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimations()
  ]
};

export const config = serverConfig;
