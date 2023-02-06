import { Photo } from '../shared/model/photo.model';
import { PhotoInfoViewerContent } from '../photo-info-viewer/photo-info-viewer-content';

const selectedTileCssClass = 'selected-tile';
const selectedTileCssSelector = `.${selectedTileCssClass}`;

export class PhotoClusterViewer {
  public static create(photos: Photo[]) {
    photos = this.sortPhotos(photos);

    const root = document.createElement('div');
    root.className = 'photo-cluster-viewer-root';

    const rightPane = document.createElement('div');
    rightPane.className = 'photo-cluster-viewer-right-pane';
    rightPane.appendChild(PhotoInfoViewerContent.request('leaflet-map-popup', photos[0]));

    const onTileClick = (photo: Photo) => {
      rightPane.replaceChildren(PhotoInfoViewerContent.request('leaflet-map-popup', photo));
    };

    const leftPane = this.createLeftPane(photos, onTileClick);

    root.append(leftPane, rightPane);
    return root;
  }

  private static sortPhotos(photos: Photo[]) {
    const dateAvailablePhotos = photos.filter(photo => !!photo?.exif?.dateTimeOriginal?.moment);
    const dateUnavailablePhotos = photos.filter(photo => !photo?.exif?.dateTimeOriginal?.moment);
    dateAvailablePhotos.sort((a, b) => {
      const aMoment = a.exif.dateTimeOriginal.moment;
      const bMoment = b.exif.dateTimeOriginal.moment;
      return aMoment.diff(bMoment);
    });
    dateUnavailablePhotos.sort((a, b) => a?.name?.localeCompare?.(b?.name));
    const sortedPhotos = [...dateAvailablePhotos, ...dateUnavailablePhotos];
    return sortedPhotos;
  }

  private static createLeftPane(photos: Photo[], onTileClick: (photo: Photo) => void) {
    const leftPane = document.createElement('div');
    leftPane.className = 'photo-cluster-viewer-left-pane';

    const tiles = photos.map(photo => {
      const content = PhotoInfoViewerContent.request('leaflet-map-div-icon', photo);
      this.adjustPhotoInfoViewerContentForTile(content, photo);
      content.onclick = () => {
        const previousSelectedTiles = leftPane.querySelectorAll(selectedTileCssSelector);
        previousSelectedTiles.forEach(tile => tile.classList.remove(selectedTileCssClass));
        content.classList.add(selectedTileCssClass);
        onTileClick(photo);
      };
      return content;
    });
    setTimeout(() => tiles[0].click()); // Select the first tile by default. setTimeout is required for the others to be deselected.

    leftPane.append(...tiles);

    return leftPane;
  }

  private static adjustPhotoInfoViewerContentForTile(contentRoot: HTMLDivElement, photo: Photo) {
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
      dateTimeTaken.style.fontWeight = '600';
      dateTimeTaken.style.fontSize = '12px';
      dateTimeTaken.style.lineHeight = '12px';
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
}
