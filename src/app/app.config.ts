import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, provideCheckNoChangesConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideEchartsCore } from 'ngx-echarts';
import { AppConfig } from '../environments/environment';
import { routes } from './app.routes';
import { AnalyticsErrorHandler } from './shared/error/analytics-error-handler';

/** The providers of the whole application, which src/main.ts starts with. */
export const appConfig: ApplicationConfig = {
  providers: [
    // Without Zone.js, Angular renders what signals, template events, markForCheck() and the like tell it about.
    provideZonelessChangeDetection(),
    // Development builds check every view each second for a binding that changed without telling Angular, which
    // would not be rendered. Angular reports one as NG0100 (ExpressionChangedAfterItHasBeenCheckedError) to the
    // ErrorHandler, which logs it.
    ...(AppConfig.production ? [] : [provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })]),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
        failOnError: true, // Preserve the original loader's HTTP error propagation.
      }),
    }),
    provideEchartsCore({
      echarts: async () => {
        // ECharts and its official v5 theme share the same core in the ESM bundle,
        // so the theme registers on the instance passed to ngx-echarts.
        const echarts = await import('echarts');
        await import('echarts/theme/v5.js');
        if (typeof process !== 'undefined' && process.env.PLM_E2E === '1') {
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
