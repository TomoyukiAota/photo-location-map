import { Analytics } from '../../../../src-shared/analytics/analytics';
import { openContainingFolder } from '../../../../src-shared/command/command';
import { openUrl } from '../../../../src-shared/url/open-url';
import { Photo } from '../../shared/model/photo.model';
import { photoInfoViewerLogger as logger } from '../photo-info-viewer-logger';
import { requestMainProcessToLaunchPhotoDataViewer } from './view-data/request-main-process-to-launch-photo-data-viewer';

interface MoreOptionsMenuItem {
  text: string;
  onClick: (event: MouseEvent) => void;
}

export function getMoreOptionsMenuItems(photo: Photo): MoreOptionsMenuItem[] {
  const menuItems: MoreOptionsMenuItem[] = [];
  menuItems.push({
    text: 'Open Folder',
    onClick: () => handleOpenFolderMenuItemClicked(photo)
  });

  if (photo.hasGpsInfo) {
    menuItems.push({
      text: 'Open Google Maps',
      onClick: () => handleOpenGoogleMapsMenuItemClicked(photo)
    });
    menuItems.push({
      text: 'Open Google Street View',
      onClick: () => handleOpenGoogleStreetViewMenuItemClicked(photo)
    });
  }

  menuItems.push({
    text: 'View Data',
    onClick: () => handleViewDataMenuItemClicked(photo)
  })

  return menuItems;
}

function handleOpenFolderMenuItemClicked(photo: Photo) {
  logger.info(`Clicked "Open Folder" menu item for ${photo.path}`);
  Analytics.trackEvent('Photo Info Viewer', 'Clicked Open Folder Menu Item');
  openContainingFolder(photo.path);
}

function handleOpenGoogleMapsMenuItemClicked(photo: Photo) {
  logger.info(`Clicked "Open Google Maps" menu item for ${photo.path}`);
  Analytics.trackEvent('Photo Info Viewer', 'Clicked "Open Google Maps" Menu Item');
  const {latitude, longitude} = photo.exif.gpsInfo.latLng;
  const zoom = 14;
  openUrl(`https://maps.google.com/?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=${zoom}`,
          '"Open Google Maps" Menu Item',
          'Photo Info Viewer',
          'https://maps.google.com/ with query parameters for latitude, longitude, and zoom');
}

function handleOpenGoogleStreetViewMenuItemClicked(photo: Photo) {
  logger.info(`Clicked "Open Google Street View" menu item for ${photo.path}`);
  Analytics.trackEvent('Photo Info Viewer', 'Clicked "Open Google Street View" Menu Item');
  const {latitude, longitude} = photo.exif.gpsInfo.latLng;
  openUrl(`https://www.google.com/maps/@?api=1&map_action=pano&parameters&viewpoint=${latitude},${longitude}`,
          '"Open Google Street View" Menu Item',
          'Photo Info Viewer',
          'https://www.google.com/maps/ with query parameters for latitude, longitude');
}

function handleViewDataMenuItemClicked(photo: Photo) {
  logger.info(`Clicked "View Data" menu item for ${photo.path}`);
  Analytics.trackEvent('Photo Info Viewer', 'Clicked "View Data" Menu Item');

  requestMainProcessToLaunchPhotoDataViewer(photo);
}
