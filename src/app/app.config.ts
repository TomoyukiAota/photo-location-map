import { ApplicationConfig, ErrorHandler, provideCheckNoChangesConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';
import { startupMetadata } from '../../src-shared/startup/startup-metadata';
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
    provideEchartsCore({
      /** Loads ECharts with its v5 theme, and in an e2e run lets the test read a chart's theme. */
      echarts: async () => {
        // ECharts and its official v5 theme share the same core in the ESM bundle,
        // so the theme registers on the instance passed to ngx-echarts.
        const echarts = await import('echarts');
        await import('echarts/theme/v5.js');
        if (startupMetadata().isE2e) {
          // Read the real chart through the same namespace that ngx-echarts receives.
          (window as Window & { __plmReadChartTheme?: (element: HTMLElement) => unknown }).__plmReadChartTheme = element => ({
            palette: echarts.getInstanceByDom(element)?.getOption().color,
            api: {
              init: typeof echarts.init,
              getInstanceByDom: typeof echarts.getInstanceByDom,
              registerTheme: typeof echarts.registerTheme,
            },
          });
        }
        return echarts;
      },
    }),
    { provide: ErrorHandler, useClass: AnalyticsErrorHandler },
  ],
};
