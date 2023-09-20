import { trimStringWithEllipsis } from '../../../../src-shared/string/trim-string-with-ellipsis';
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
  container.className = 'plm-leaflet-map-div-icon-content-container';

  const dateTimeOriginal = photo?.exif?.dateTimeOriginal;
  if (dateTimeOriginal) {
    const date = document.createElement('div');
    date.innerText = dateTimeOriginal.toDateString();
    const time = document.createElement('div');
    time.innerText = dateTimeOriginal.toTimeString();
    container.append(date, time);
  } else {
    const name = document.createElement('div');
    name.className = 'plm-leaflet-map-div-icon-content-name';
    const textLengthLimit = 16;
    const {isTrimmed, output: text} = trimStringWithEllipsis(photo.name, textLengthLimit);
    name.innerText = text;
    name.title = isTrimmed ? photo.name : '';
    container.append(name);
  }

  return container;
}
