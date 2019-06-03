import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { calculateCenterLatLng, LatLng } from '../../shared/model/lat-lng.model';
import { Photo } from '../../shared/model/photo.model';

declare var google;

@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss']
})
export class GoogleMapsComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscription: Subscription;
  public photos: Photo[];

  public centerLatitude = 51.678418;
  public centerLongitude = 7.809007;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private selectedPhotoService: SelectedPhotoService) {
  }

  ngOnInit(): void {
    this.subscription = this.selectedPhotoService.selectedPhotosChanged.subscribe(
      (photos: Photo[]) => {
        this.photos = photos;
        // this.updateCenterLatLng(photos);

        console.log(window['google']);
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
    const script = document.createElement('script');
    script.setAttribute('src', 'http://maps.google.com/maps/api/js');
    script.setAttribute('type', 'text/javascript');
    script.async = false;

    const div = document.getElementById('google-map');
    div.parentNode.insertBefore(script, null);

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
}
