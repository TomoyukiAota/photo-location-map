import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { calculateCenterLatLng, LatLng } from '../../shared/model/lat-lng.model';
import { Photo } from '../../shared/model/photo.model';

@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss']
})
export class GoogleMapsComponent implements OnInit, OnDestroy {
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
        this.updateCenterLatLng(photos);
        this.changeDetectorRef.detectChanges();
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateCenterLatLng(photos: Photo[]) {
    if (photos.length === 0)
      return;

    const latLngArray = photos.map(photo => photo.gpsInfo.latLng);
    const centerLatLng = calculateCenterLatLng(latLngArray);
    this.centerLatitude = centerLatLng.latitude;
    this.centerLongitude = centerLatLng.longitude;
  }
}
