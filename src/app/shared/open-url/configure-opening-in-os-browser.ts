import { ElementRef } from '@angular/core';
import { openUrl } from './open-url';

export function configureOpeningInOsBrowser(elementRef: ElementRef<HTMLElement>,
                                            url: string,
                                            urlDescription: string,
                                            from: string): void {
  elementRef.nativeElement.addEventListener('click', event => {
    event.preventDefault();
    openUrl(url, urlDescription, from);
  });
}
