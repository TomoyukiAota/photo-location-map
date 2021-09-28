const element = document.createElement('div');
element.style.textAlign = 'center';
element.innerText = 'Photo information is unavailable.';

export class PhotoInfoUnavailableElement {
  public static get(): HTMLDivElement {
    return element.cloneNode(true) as HTMLDivElement;
  }
}
