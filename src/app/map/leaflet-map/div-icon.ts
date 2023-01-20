import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { Photo } from '../../shared/model/photo.model';

export function createDivIconHtml(photo: Photo): HTMLElement {
  const divIcon = document.createElement('div');
  divIcon.className = 'plm-leaflet-map-div-icon';

  const content = document.createElement('div');
  content.className = 'plm-leaflet-map-div-icon-content';
  content.appendChild(createDivIconContent(photo));

  const tail = document.createElement('div');
  tail.className = 'plm-leaflet-map-div-icon-tail';

  divIcon.append(content, tail);
  return divIcon;
}

function createDivIconContent(photo: Photo): HTMLElement {
  const photoInfoViewer = PhotoInfoViewerContent.request('leaflet-map-div-icon', photo);
  adjustPhotoInfoViewerContentForDivIcon(photoInfoViewer, photo);
  return photoInfoViewer;
}

function adjustPhotoInfoViewerContentForDivIcon(contentRoot: HTMLDivElement, photo: Photo) {
  const thumbnailContainer = contentRoot.querySelector('.photo-info-viewer-thumbnail-container') as HTMLElement;
  if (thumbnailContainer) {
    thumbnailContainer.style.width = '100px';
    thumbnailContainer.style.height = '100px';
  }

  const thumbnail = contentRoot.querySelector('.photo-info-viewer-thumbnail') as HTMLElement;
  if (thumbnail) {
    thumbnail.onclick = () => {/* Do nothing */};
    thumbnail.style.boxShadow = 'none';
    thumbnail.style.filter = 'none';
  }

  const name = contentRoot.querySelector('.photo-info-viewer-name') as HTMLElement;
  if (name) {
    name.style.display = 'none';
  }

  const dateTimeTaken = contentRoot.querySelector('.photo-info-viewer-date-time-taken') as HTMLElement;
  if (dateTimeTaken) {
    dateTimeTaken.style.padding = '0';
    dateTimeTaken.style.fontWeight = 'normal';
    dateTimeTaken.style.lineHeight = '1.2';
    dateTimeTaken.innerText = '';
    const date = document.createElement('div');
    date.innerText = photo?.exif?.dateTimeOriginal?.toDateString() || '';
    const time = document.createElement('div');
    time.innerText = photo?.exif?.dateTimeOriginal?.toTimeString() || '';
    dateTimeTaken.append(date, time);
  }

  const lowerDiv = contentRoot.querySelector('.photo-info-viewer-lower-div') as HTMLElement;
  if (lowerDiv) {
    lowerDiv.style.display = 'none';
  }

  return contentRoot;
}
