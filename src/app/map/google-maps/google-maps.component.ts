import { AfterViewInit, Component, effect, signal, untracked, inject } from '@angular/core';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';
import { Photo } from '../../shared/model/photo.model';
import { GoogleMapsApiKeyHandler } from './google-maps-api-key-handler';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { GoogleMapsApiLoader } from './google-maps-api-loader';

@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss']
})
export class GoogleMapsComponent implements AfterViewInit {
  private pinnedPhotoService = inject(PinnedPhotoService);

  // Whether the Google Maps API has loaded; ngAfterViewInit loads it for the first Google map of a launch.
  private readonly isApiLoaded = signal(typeof google !== 'undefined');

  constructor() {
    // The one place that renders: once the API has loaded, and again whenever other photos are pinned. Every render
    // creates a map, which uses the API's quota, so a map is not created twice for the same photos.
    effect(() => {
      const photos = [...this.pinnedPhotoService.pinnedPhotos()];
      if (!this.isApiLoaded()) return;
      untracked(() => this.renderGoogleMaps(photos));
    });
  }

  ngAfterViewInit(): void {
    if (!this.isApiLoaded()) {
      this.initializeGoogleMaps();
    }
  }

  private initializeGoogleMaps(): void {
    const apiKey = GoogleMapsApiKeyHandler.fetchApiKey();

    const scriptElement = document.createElement('script');
    scriptElement.setAttribute('src', `http://maps.google.com/maps/api/js?key=${apiKey}`);
    scriptElement.setAttribute('type', 'text/javascript');
    scriptElement.async = false;

    const divElementForGoogleMaps = document.getElementById('google-map');
    divElementForGoogleMaps.parentNode.insertBefore(scriptElement, null);

    GoogleMapsApiLoader.waitUntilLoaded()
      .then(() => this.isApiLoaded.set(true))
      .catch(() => this.displayGoogleMapsLoadFailureMessage());
  }

  private displayGoogleMapsLoadFailureMessage(): void {
    document.getElementById('google-map').innerText = 'Failed to load Google Maps. Please check Internet connection to Google Maps.';
  }

  private renderGoogleMaps(photos: Photo[]) {
    if (photos.length === 0) {
      this.renderInitialGoogleMapsState();
    } else {
      this.renderGoogleMapsWithPhotos(photos);
    }
  }

  private renderInitialGoogleMapsState(): void {
    // "new" for google.maps.Map is required although the reference to the instantiated object is not required.
    // Without "new", the map is not rendered.

    new google.maps.Map(document.getElementById('google-map'), {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: { lat: 0.0, lng: 0.0 },
      zoom: 2
    });
  }

  private renderGoogleMapsWithPhotos(photos: Photo[]) {
    const map = new google.maps.Map(document.getElementById('google-map'), {
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    const infoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();

    let marker, i;
    for (i = 0; i < photos.length; i++) {
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(photos[i].exif.gpsInfo.latLng.latitude, photos[i].exif.gpsInfo.latLng.longitude),
        map: map
      });
      bounds.extend(marker.position);
      google.maps.event.addListener(marker, 'click', (function (clickedMarker, clickedIndex) {
        return function () {
          const content = PhotoInfoViewerContent.request('google-maps', photos[clickedIndex]);
          infoWindow.setContent(content);
          infoWindow.open(map, clickedMarker);
        };
      })(marker, i));
    }

    google.maps.event.addListenerOnce(map, 'bounds_changed', function (event) {
      const initialMaxZoomLevel = 13;
      if (this.getZoom() > initialMaxZoomLevel) {
        this.setZoom(initialMaxZoomLevel);
      }
    });

    map.fitBounds(bounds);
  }
}
