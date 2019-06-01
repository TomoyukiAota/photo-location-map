import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectedPhotoService } from '../../shared/selected-photo.service';
import { LatLng } from '../../shared/model/lat-lng.model';
import { Photo } from '../../shared/model/photo.model';

@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss']
})
export class GoogleMapsComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  public photos: Photo[];

  public lat = 51.678418;
  public lng = 7.809007;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private selectedPhotoService: SelectedPhotoService) {
  }

  ngOnInit(): void {
    this.subscription = this.selectedPhotoService.selectedPhotosChanged.subscribe(
      (photos: Photo[]) => {
        this.photos = photos;
        this.updateCenterLatLng(photos);
        this.changeDetectorRef.detectChanges();
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateCenterLatLng(photos: Photo[]) {
    const totalLatLng = photos.reduce((previous: LatLng, current: Photo) => {
      return new LatLng(
        previous.latitude + current.gpsInfo.gpsLatitude,
        previous.longitude + current.gpsInfo.gpsLongitude
      );
    }, new LatLng());
    const centerLat = totalLatLng.latitude / photos.length;
    const centerLng = totalLatLng.longitude / photos.length;
    this.lat = centerLat;
    this.lng = centerLng;
  }
}
