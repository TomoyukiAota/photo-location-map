import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Map } from 'leaflet';
import { Photo } from '../../shared/model/photo.model';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { OsmForceRenderService } from './osm-force-render/osm-force-render.service';

// "declare var L: any;" is defined here (in addition to global scope typing given by type-declaration/index.d.ts)
// in order to avoid the compile errors for the types from leaflet.markercluster
declare var L: any;

@Component({
  selector: 'app-osm',
  templateUrl: './osm.component.html',
  styleUrls: ['./osm.component.scss']
})
export class OsmComponent implements OnInit, OnDestroy, AfterViewInit {
  private selectedPhotoServiceSubscription: Subscription;
  private osmForceRenderServiceSubscription: Subscription;
  private map: Map;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private selectedPhotoService: SelectedPhotoService,
              private osmForceRenderService: OsmForceRenderService) {
  }

  ngOnInit(): void {
    this.selectedPhotoServiceSubscription = this.selectedPhotoService.selectedPhotosChanged.subscribe(
      photos => this.renderOsm(photos)
    );
    this.osmForceRenderServiceSubscription = this.osmForceRenderService.forceRenderWithoutPhotoHappened.subscribe(
      () => this.renderOsm([])
    );
  }

  ngOnDestroy(): void {
    this.selectedPhotoServiceSubscription.unsubscribe();
    this.osmForceRenderServiceSubscription.unsubscribe();
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

  private ensureOsmRemoved(): void {
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
    this.map.once('moveend', event => {
      const initialMaxZoomLevel = 13;
      if (this.map.getZoom() > initialMaxZoomLevel) {
        this.map.setZoom(initialMaxZoomLevel);
      }
    });
  }

  private renderMarkerClusterGroup(photos: Photo[]): void {
    const markerClusterGroup = L.markerClusterGroup();

    photos.forEach(photo => {
      const latLng = [photo.exif.gpsInfo.latLng.latitude, photo.exif.gpsInfo.latLng.longitude];
      const marker = L.marker(latLng).bindPopup(PhotoInfoViewerContent.generate(photo));
      markerClusterGroup.addLayer(marker);
    });

    this.map.addLayer(markerClusterGroup);
    this.map.fitBounds(markerClusterGroup.getBounds());
  }
}
