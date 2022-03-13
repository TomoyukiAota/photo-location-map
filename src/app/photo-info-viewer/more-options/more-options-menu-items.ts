import { Analytics } from '../../../../src-shared/analytics/analytics';
import { openContainingFolder } from '../../../../src-shared/command/command';
import { Photo } from '../../shared/model/photo.model';
import { photoInfoViewerLogger as logger } from '../photo-info-viewer-logger';

interface MoreOptionsMenuItem {
  text: string;
  onClick: (event: MouseEvent) => void;
}

export function getMoreOptionsMenuItems(photo: Photo): MoreOptionsMenuItem[] {
  return [
    {
      text: 'Open Folder',
      onClick: () => handleOpenFolderMenuItemClicked(photo)
    },
    {
      text: 'Open Google Maps',
      onClick: handleOpenGoogleMapsMenuItemClicked
    }
  ];
}

function handleOpenFolderMenuItemClicked(photo: Photo) {
  logger.info(`Clicked the open folder icon for ${photo.path}`);
  Analytics.trackEvent('Photo Info Viewer', 'Clicked Open Folder Icon');
  openContainingFolder(photo.path);
}

function handleOpenGoogleMapsMenuItemClicked() {
  console.log('handleOpenGoogleMapsMenuItemClicked');
}
