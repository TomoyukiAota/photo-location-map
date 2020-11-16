import { ElementRef } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../src-shared/log/logger';
import { ProxyRequire } from '../../../../src-shared/require/proxy-require';

const shell = ProxyRequire.electron.shell;

export const configureOpeningInOsBrowser = (elementRef: ElementRef<HTMLElement>, url: string) => {
  elementRef.nativeElement.addEventListener('click', event => {
    event.preventDefault();
    // noinspection JSIgnoredPromiseFromCall
    shell.openExternal(url);
    Logger.info(`Opened URL in OS browser: ${url}`);
    Analytics.trackEvent('Opened URL in OS browser', url);
  });
};
