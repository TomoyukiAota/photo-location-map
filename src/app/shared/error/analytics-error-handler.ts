import { ErrorHandler, Injectable } from '@angular/core';
import { recordUnhandledError } from '../../../../src-shared/analytics/record-error';

// Angular's default handling (logging to the console), plus recording the error for analytics without paths.
// Angular routes errors from the app's code and unhandled promise rejections here.
@Injectable()
export class AnalyticsErrorHandler extends ErrorHandler {
  public override handleError(error: unknown): void {
    super.handleError(error);
    recordUnhandledError(error, 'Renderer');
  }
}

/**
 * Errors outside Angular's zone do not reach the ErrorHandler; for example, those in the buttons of the map's
 * photo popups, which Leaflet creates. They reach these listeners on the window instead.
 */
export function recordErrorsOutsideAngular(): void {
  window.addEventListener('error', event => recordUnhandledError(event.error ?? event.message, 'Renderer'));
  window.addEventListener('unhandledrejection', event => recordUnhandledError(event.reason, 'Renderer'));
}
