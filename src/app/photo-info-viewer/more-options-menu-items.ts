import { Photo } from '../shared/model/photo.model';

interface MoreOptionsMenuItem {
  text: string;
  onClick: (event: MouseEvent) => void;
}

export function getMoreOptionsMenuItems(photo: Photo): MoreOptionsMenuItem[] {
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
