import { ApplicationConfig, ErrorHandler, provideCheckNoChangesConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';
import { AppConfig } from '../environments/environment';
import { routes } from './app.routes';
import { AnalyticsErrorHandler } from './shared/error/analytics-error-handler';

/** The providers of the whole application, which src/start-app.ts starts with. */
export const appConfig: ApplicationConfig = {
  providers: [
    // Without Zone.js, Angular renders what signals, template events, markForCheck() and the like tell it about.
    provideZonelessChangeDetection(),
    // Development builds check every view each second for a binding that changed without telling Angular, which
    // would not be rendered. Angular reports one as NG0100 (ExpressionChangedAfterItHasBeenCheckedError) to the
    // ErrorHandler, which logs it.
    ...(AppConfig.production ? [] : [provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })]),
    provideRouter(routes, withHashLocation()),
    provideEchartsCore({ echarts: () => import('echarts') }),
    { provide: ErrorHandler, useClass: AnalyticsErrorHandler },
  ],
};
