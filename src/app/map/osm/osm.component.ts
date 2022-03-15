import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LayersControlEvent, Map } from 'leaflet';
import { Photo } from '../../shared/model/photo.model';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { OsmForceRenderService } from './osm-force-render/osm-force-render.service';

// References to implement Bing Maps with leaflet-plugins:
// - https://github.com/shramov/leaflet-plugins/blob/master/examples/bing.html
// - https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js
import 'leaflet-plugins/layer/tile/Bing'; // Equivalent to <script src="https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js"></script>
import 'leaflet-plugins/layer/tile/Bing.addon.applyMaxNativeZoom'

// "declare let L: any;" is defined here (in addition to global scope typing given by type-declaration/index.d.ts)
// in order to avoid the compile errors for the types from leaflet.markercluster
declare let L: any;

@Component({
  selector: 'app-osm',
  templateUrl: './osm.component.html',
  styleUrls: ['./osm.component.scss']
})
export class OsmComponent implements OnInit, OnDestroy, AfterViewInit {
  private selectedPhotoServiceSubscription: Subscription;
  private osmForceRenderServiceSubscription: Subscription;
  private map: Map;
  private selectedLayerName: string = null;

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

    const bingMapsKey = '96S0sLgTrpX5VudevEyg~93qOp_-tPdiBcUw_Q-mpUg~AtbViWkzvmAlU9MB08o4mka92JlnRQnYHrHP8GKZBbl0caebqVS95jsvOKVHvrt3';
    const bingMapsOptions = {
      key: bingMapsKey,
      maxNativeZoom: 19,
      maxZoom: 19,
      culture: this.getCultureForMap(),
    };
    const bingRoadOnDemandLayer = new L.bingLayer(L.extend({imagerySet: 'RoadOnDemand'}, bingMapsOptions));
    const bingAerialLayer = new L.bingLayer(L.extend({imagerySet: 'Aerial'}, bingMapsOptions));
    const bingAerialWithLabelsOnDemandLayer = new L.bingLayer(L.extend({imagerySet: 'AerialWithLabelsOnDemand'}, bingMapsOptions));

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxNativeZoom: 19,
      maxZoom: 19,
    });

    const layers = {
      'Bing (Road)': bingRoadOnDemandLayer,
      'Bing (Aerial)': bingAerialLayer,
      'Bing (Aerial with Labels)': bingAerialWithLabelsOnDemandLayer,
      'OpenStreetMap': osmLayer,
    };
    L.control.layers(layers).addTo(this.map);

    const selectedLayer = this.selectedLayerName
      ? layers[this.selectedLayerName]  // Keep the previously selected layer, or
      : bingRoadOnDemandLayer;          // set the default layer
    selectedLayer.addTo(this.map);

    this.map.once('moveend', event => {
      const initialMaxZoomLevel = 13;
      if (this.map.getZoom() > initialMaxZoomLevel) {
        this.map.setZoom(initialMaxZoomLevel);
      }
    });

    this.map.on('baselayerchange', (event: LayersControlEvent) => {
      this.selectedLayerName = event.name;
    });
  }

  private renderMarkerClusterGroup(photos: Photo[]): void {
    const markerClusterGroup = L.markerClusterGroup();

    photos.forEach(photo => {
      const latLng = [photo.exif.gpsInfo.latLng.latitude, photo.exif.gpsInfo.latLng.longitude];
      const marker = L.marker(latLng).bindPopup(PhotoInfoViewerContent.request('osm', photo));
      markerClusterGroup.addLayer(marker);
    });

    this.map.addLayer(markerClusterGroup);
    this.map.fitBounds(markerClusterGroup.getBounds());
  }

  private getCultureForMap(): string {
    // navigator.language is used because it seems to match the supported culture code for Bing Maps.
    // For Bing Maps, it's still safe in case navigator.language does not match the supported culture code
    // because passing some random string for the culture option results in the default culture (en-US).
    // navigator.language on MDN: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language
    // Bing Maps Supported Culture Codes: https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes
    return navigator.language;
  }
}
