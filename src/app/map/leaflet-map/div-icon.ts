import { trimStringWithEllipsis } from '../../../../src-shared/string/trim-string-with-ellipsis';
import { Photo } from '../../shared/model/photo.model';

/**
 * The label of a photo's marker: its shooting time, or its name when the time is unknown.
 * TL;DR: Built with DOM calls on purpose, unlike the popups, which are Angular components.
 * Details: There is a label for every photo on the map, made whenever the map is rendered, tens of thousands for a
 * large folder, while a popup is made for the few photos that the user looks at. A label is a few elements of text
 * without a listener or a state of its own: Leaflet handles the click on a marker, and the map component colors the
 * label of the marker whose popup is open. A component would add its cost to each label without giving anything.
 */
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
