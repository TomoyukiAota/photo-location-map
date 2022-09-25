import { DefaultCatch } from '../../decorator/catch';
import { PrependedLogger } from '../../log/create-prepended-logger';

export const AnalyticsLibraryWrapperInitialize = (logger: PrependedLogger) => {
  return DefaultCatch((error: any, ctx: any) => {
    logger.error('An unhandled exception occurred in analytics initialization.');
    logger.error(`error: ${error}`, error);
  });
};

export const AnalyticsLibraryWrapperSetUserAgent = (logger: PrependedLogger) => {
  return DefaultCatch((error: any, ctx: any, userAgent: string) => {
    logger.warn('An unhandled exception occurred in analytics setUserAgent.');
    logger.warn(`error: ${error}`, error);
    logger.warn(`userAgent: ${userAgent}`);
  });
};

export const AnalyticsLibraryWrapperTrackEvent = (logger: PrependedLogger) => {
  return DefaultCatch((error: any, ctx: any, category: string, action: string, label?: string, value?: string | number) => {
    logger.warn('An unhandled exception occurred in analytics trackEvent.');
    logger.warn(`error: ${error}`, error);
    logger.warn(`category: ${category}, action: ${action}, label: ${label}, value: ${value}`);
  });
};
