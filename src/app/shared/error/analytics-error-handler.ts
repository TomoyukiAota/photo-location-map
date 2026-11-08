import { ErrorHandler, Service } from '@angular/core';
import { recordUnhandledError } from '../../../../src-shared/analytics/record-error';

// Angular's default handling (logging to the console), plus recording the error for analytics without paths.
// Angular routes the errors it catches here: those thrown in templates, their event listeners, lifecycle hooks and
// effects. Without Zone.js, an unhandled promise rejection does not come here; the listeners below record it.
@Service({ autoProvided: false })
export class AnalyticsErrorHandler extends ErrorHandler {
  public override handleError(error: unknown): void {
    super.handleError(error);
    recordUnhandledError(error, 'Renderer');
  }
}

/**
 * Errors that Angular does not catch reach these listeners on the window instead: unhandled promise rejections, and
 * errors thrown in callbacks that Angular does not call, such as the buttons of the map's photo popups, which Leaflet
 * creates.
 */
export function recordErrorsOutsideAngular(): void {
  window.addEventListener('error', event => recordUnhandledError(event.error ?? event.message, 'Renderer'));
  window.addEventListener('unhandledrejection', event => recordUnhandledError(event.reason, 'Renderer'));
}
