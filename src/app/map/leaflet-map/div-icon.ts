import { trimStringWithEllipsis } from '../../../../src-shared/string/trim-string-with-ellipsis';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { Photo } from '../../shared/model/photo.model';

export function createDivIconHtml(photo: Photo): HTMLElement {
  const divIcon = document.createElement('div');
  divIcon.className = 'plm-leaflet-map-div-icon-content-and-tail';

  const content = document.createElement('div');
  content.className = 'plm-leaflet-map-div-icon-content';
  content.appendChild(createDivIconContent(photo));

  const tail = document.createElement('div');
  tail.className = 'plm-leaflet-map-div-icon-tail';

  divIcon.append(content, tail);
  return divIcon;
}

function createDivIconContent(photo: Photo): HTMLElement {
  const container = document.createElement('div');
  container.className = 'plm-leaflet-map-div-icon-piv-container';

  const minimizeButton = document.createElement('button');
  minimizeButton.className = 'plm-leaflet-map-div-icon-min-button';
  minimizeButton.innerText = '-';
  minimizeButton.title = 'Minimize';
  minimizeButton.onclick = event => handleMinimizeButtonClicked(event, photo);

  const photoInfoViewer = PhotoInfoViewerContent.request('leaflet-map-div-icon', photo);
  adjustPhotoInfoViewerContentForDivIcon(photoInfoViewer, photo);

  container.append(minimizeButton, photoInfoViewer);
  return container;
}

function handleMinimizeButtonClicked(event: MouseEvent, photo: Photo) {
  event.stopPropagation(); // Avoid the map to receive click so that spiderfy is kept.
  const content = (event.target as HTMLElement)?.closest('.plm-leaflet-map-div-icon-content') as HTMLElement;
  const minimizedInfo = document.createElement('div');
  minimizedInfo.className = 'plm-leaflet-map-div-icon-minimized-content';
  const dateTimeOriginal = photo?.exif?.dateTimeOriginal;
  if (dateTimeOriginal) {
    const date = document.createElement('div');
    date.innerText = dateTimeOriginal.toDateString({dayOfWeek: false});
    const time = document.createElement('div');
    time.innerText = dateTimeOriginal.toTimeString();
    minimizedInfo.append(date, time);
  } else {
    const name = document.createElement('div');
    name.className = 'plm-leaflet-map-div-icon-minimized-content-name';
    const textLengthLimit = 16;
    const {isTrimmed, output: text} = trimStringWithEllipsis(photo.name, textLengthLimit);
    name.innerText = text;
    name.title = isTrimmed ? photo.name : '';
    minimizedInfo.append(name);
  }
  minimizedInfo.onclick = event => {
    event.stopPropagation(); // Avoid the map to receive click so that spiderfy is kept.
    content.replaceChildren(createDivIconContent(photo));
  };
  content.replaceChildren(minimizedInfo);
}

function adjustPhotoInfoViewerContentForDivIcon(contentRoot: HTMLDivElement, photo: Photo) {
  contentRoot.classList.add('plm-leaflet-map-div-icon-piv');

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

  const rotateButtonInThumbnailContainer = contentRoot.querySelector('.photo-info-viewer-rotate-button-in-thumbnail-container') as HTMLElement;
  if (rotateButtonInThumbnailContainer) {
    rotateButtonInThumbnailContainer.style.display = 'inline-grid';
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
