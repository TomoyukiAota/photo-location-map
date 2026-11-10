import { t } from '../../../src-shared/i18n/i18n';

const element = document.createElement('div');
element.style.textAlign = 'center';
element.innerText = t('photoInfo.unavailable');

export class PhotoInfoUnavailableElement {
  public static get(): HTMLDivElement {
    return element.cloneNode(true) as HTMLDivElement;
  }
}
