import { Photo } from '../shared/model/photo.model';

interface MenuItem {
  text: string;
  onClick: (event: MouseEvent) => void;
}

function getMenuItems(photo: Photo): MenuItem[] {
  return [
    {
      text: 'Open Folder',
      onClick: handleOnOpenFolderMenuItemClicked
    },
    {
      text: 'Open Google Maps',
      onClick: handleOnOpenGoogleMapsMenuItemClicked
    }
  ];
}

function handleOnOpenFolderMenuItemClicked() {
  console.log('handleOnOpenFolderMenuItemClicked');
}

function handleOnOpenGoogleMapsMenuItemClicked() {
  console.log('handleOnOpenGoogleMapsMenuItemClicked');
}

export class MoreOptionsMenuElement {
  public static create(photo: Photo): HTMLElement {
    const moreOptionsMenuElement = document.createElement('div');
    moreOptionsMenuElement.className = 'photo-info-viewer-more-options-menu';

    const menuItems = getMenuItems(photo);
    menuItems.forEach(item => {
      const menuItemElement = this.createMenuItemElement(item.text, item.onClick);
      moreOptionsMenuElement.appendChild(menuItemElement);
    })

    return moreOptionsMenuElement;
  }

  private static createMenuItemElement(text: string, onClick: (event: MouseEvent) => void): HTMLElement {
    const element = document.createElement('div');
    element.className = 'photo-info-viewer-more-options-menu-item';
    element.innerText = text;
    element.onclick = onClick;
    return element;
  }
}