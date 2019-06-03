import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { Photo } from '../../shared/model/photo.model';
import { GoogleMapsApiKeyHandler } from './google-maps-api-key-handler';
import { InfoWindowContentGenerator } from './info-window-content-generator';

declare var google;

@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss']
})
export class GoogleMapsComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscription: Subscription;
  public photos: Photo[];

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private selectedPhotoService: SelectedPhotoService) {
  }

  ngOnInit(): void {
    this.subscription = this.selectedPhotoService.selectedPhotosChanged.subscribe(
      (photos: Photo[]) => {
        this.photos = photos;
        this.renderGoogleMaps(photos);
        this.changeDetectorRef.detectChanges();
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.initializeGoogleMaps();
  }

  private initializeGoogleMaps(): void {
    const apiKey = GoogleMapsApiKeyHandler.fetchApiKey();

    const scriptElement = document.createElement('script');
    scriptElement.setAttribute('src', `http://maps.google.com/maps/api/js?key=${apiKey}`);
    scriptElement.setAttribute('type', 'text/javascript');
    scriptElement.async = false;

    const divElementForGoogleMaps = document.getElementById('google-map');
    divElementForGoogleMaps.parentNode.insertBefore(scriptElement, null);

    // Wait for 1 second for Google Maps API script to load.
    // Then, render initial state of Google Maps.
    setTimeout(() => this.renderInitialGoogleMapsState(), 1000);
  }

  private renderInitialGoogleMapsState(): void {
    // "new" for google.maps.Map is required although the reference to the instantiated object is not required.
    // Without "new", the map is not rendered.

    // tslint:disable-next-line:no-unused-expression
    new google.maps.Map(document.getElementById('google-map'), {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: { lat: 0.0, lng: 0.0 },
      zoom: 2
    });
  }

  private renderGoogleMaps(photos: Photo[]) {
    const map = new google.maps.Map(document.getElementById('google-map'), {
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    const infoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();

    let marker, i;
    for (i = 0; i < photos.length; i++) {
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(photos[i].gpsInfo.latLng.latitude, photos[i].gpsInfo.latLng.longitude),
        map: map
      });
      bounds.extend(marker.position);
      google.maps.event.addListener(marker, 'click', (function (clickedMarker, clickedIndex) {
        return function () {
          const content = InfoWindowContentGenerator.generate(photos[clickedIndex]);
          infoWindow.setContent(content);
          infoWindow.open(map, clickedMarker);
        };
      })(marker, i));
    }

    google.maps.event.addListenerOnce(map, 'bounds_changed', function (event) {
      const initialMaxZoomLevel = 15;
      if (this.getZoom() > initialMaxZoomLevel) {
        this.setZoom(initialMaxZoomLevel);
      }
    });

    map.fitBounds(bounds);
  }
}
