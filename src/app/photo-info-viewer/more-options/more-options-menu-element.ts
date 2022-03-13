import { Photo } from '../../shared/model/photo.model';
import { getMoreOptionsMenuItems } from './more-options-menu-items';

export class MoreOptionsMenuElement {
  public static create(photo: Photo, event: MouseEvent): HTMLElement {
    const menuElement = document.createElement('div');
    menuElement.className = 'photo-info-viewer-more-options-menu';
    this.configureMenuLocation(menuElement, event);

    const menuItems = getMoreOptionsMenuItems(photo);
    menuItems.forEach(item => {
      const menuItemElement = this.createMenuItemElement(item.text, item.onClick);
      menuElement.appendChild(menuItemElement);
    })

    return menuElement;
  }

  private static configureMenuLocation(menuElement: HTMLElement, event: MouseEvent) {
    menuElement.style.right = '-35px';

    const centerHeight = document.documentElement.clientHeight / 2;
    const isMousePositionInUpperHalf = event.clientY < centerHeight;
    if (isMousePositionInUpperHalf) {
      menuElement.style.top = '35px';
    } else {
      menuElement.style.bottom = '35px';
    }
  }

  private static createMenuItemElement(text: string, onClick: (event: MouseEvent) => void): HTMLElement {
    const element = document.createElement('div');
    element.className = 'photo-info-viewer-more-options-menu-item';
    element.innerText = text;
    element.onclick = onClick;
    return element;
  }
}
