import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Map } from 'leaflet';
import { Photo } from '../../shared/model/photo.model';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';

@Component({
  selector: 'app-osm',
  templateUrl: './osm.component.html',
  styleUrls: ['./osm.component.scss']
})
export class OsmComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscription: Subscription;
  private map: Map;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private selectedPhotoService: SelectedPhotoService) {
  }

  ngOnInit(): void {
    this.subscription = this.selectedPhotoService.selectedPhotosChanged.subscribe(
      photos => this.renderOsm(photos)
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    const photos = this.selectedPhotoService.getSelectedPhotos();
    this.renderOsm(photos);
  }

  private renderOsm(photos: Photo[]): void {
    this.ensureOsmRemoved();
    this.initializeOsm();

    if (photos.length > 0) {
      this.renderMarkerClusterGroup(photos);
    }

    this.changeDetectorRef.detectChanges();
  }

  private ensureOsmRemoved() {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  }

  private initializeOsm(): void {
    this.map = L.map('osm').setView([0, 0], 2);
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxNativeZoom: 19,
      maxZoom: 19
    });
    tileLayer.addTo(this.map);
  }

  private renderMarkerClusterGroup(photos: Photo[]) {
    const markerClusterGroup = L.markerClusterGroup();

    photos.forEach(photo => {
      const latLng = [photo.gpsInfo.latLng.latitude, photo.gpsInfo.latLng.longitude];
      const marker = L.marker(latLng).bindPopup(PhotoInfoViewerContent.generate(photo));
      markerClusterGroup.addLayer(marker);
    });

    this.map.addLayer(markerClusterGroup);
    this.map.fitBounds(markerClusterGroup.getBounds());
  }
}
