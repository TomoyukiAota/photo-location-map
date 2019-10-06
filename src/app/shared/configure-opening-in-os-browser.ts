import { ElementRef } from '@angular/core';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';

const shell = ProxyRequire.electron.shell;

export const configureOpeningInOsBrowser = (elementRef: ElementRef<HTMLElement>, url: string) => {
  elementRef.nativeElement.addEventListener('click', event => {
    event.preventDefault();
    // noinspection JSIgnoredPromiseFromCall
    shell.openExternal(url);
  });
};
