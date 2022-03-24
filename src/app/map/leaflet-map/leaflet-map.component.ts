import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LayersControlEvent, Map } from 'leaflet';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { Photo } from '../../shared/model/photo.model';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { LeafletMapForceRenderService } from './leaflet-map-force-render/leaflet-map-force-render.service';

// References to implement Bing Maps with leaflet-plugins:
// - https://github.com/shramov/leaflet-plugins/blob/master/examples/bing.html
// - https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js
import 'leaflet-plugins/layer/tile/Bing'; // Equivalent to <script src="https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js"></script>
import 'leaflet-plugins/layer/tile/Bing.addon.applyMaxNativeZoom'

// "declare let L: any;" is defined here (in addition to global scope typing given by type-declaration/index.d.ts)
// in order to avoid the compile errors for the types from leaflet.markercluster
declare let L: any;

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss']
})
export class LeafletMapComponent implements OnInit, OnDestroy, AfterViewInit {
  private selectedPhotoServiceSubscription: Subscription;
  private forceRenderServiceSubscription: Subscription;
  private map: Map;
  private readonly commonLayerOptions = {
    maxNativeZoom: 19,
    maxZoom: 19,
  };
  private get selectedLayerName(): string {
    return UserDataStorage.readOrDefault(UserDataStoragePath.LeafletMap.SelectedLayer, null);
  }
  private set selectedLayerName(layerName: string) {
    UserDataStorage.write(UserDataStoragePath.LeafletMap.SelectedLayer, layerName);
    Analytics.trackEvent('Leaflet Map', `Changed Layer to "${layerName}"`);
  }

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private selectedPhotoService: SelectedPhotoService,
              private forceRenderService: LeafletMapForceRenderService) {
  }

  public ngOnInit(): void {
    this.selectedPhotoServiceSubscription = this.selectedPhotoService.selectedPhotosChanged.subscribe(
      photos => this.renderMap(photos)
    );
    this.forceRenderServiceSubscription = this.forceRenderService.forceRenderWithoutPhotoHappened.subscribe(
      () => this.renderMap([])
    );
  }

  public ngOnDestroy(): void {
    this.selectedPhotoServiceSubscription.unsubscribe();
    this.forceRenderServiceSubscription.unsubscribe();
  }

  public ngAfterViewInit(): void {
    const photos = this.selectedPhotoService.getSelectedPhotos();
    this.renderMap(photos);
  }

  private renderMap(photos: Photo[]): void {
    this.ensureMapRemoved();
    this.initializeMap();

    if (photos.length > 0) {
      this.renderMarkerClusterGroup(photos);
    }

    this.changeDetectorRef.detectChanges();
  }

  private ensureMapRemoved(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  }

  private initializeMap(): void {
    this.map = L.map('leaflet-map').setView([0, 0], 2);
    this.setAttributionPrefix();
    const bingLayer = this.getBingLayer();
    const osmLayer = this.getOsmLayer();

    const layers = {
      'Bing (Road)': bingLayer.roadOnDemand,
      'Bing (Aerial)': bingLayer.aerial,
      'Bing (Aerial with Labels)': bingLayer.aerialWithLabelsOnDemand,
      'OpenStreetMap': osmLayer,
    };
    L.control.layers(layers).addTo(this.map);

    const previousLayer = layers[this.selectedLayerName];
    const defaultLayer =  bingLayer.roadOnDemand;
    const selectedLayer = previousLayer ?? defaultLayer;
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

  private setAttributionPrefix(): void {
    // Manually set to 'Leaflet' without the URL link.
    // The default is 'Leaflet' with the link to https://leafletjs.com/
    // The page will be opened within the application window, which confuses users.
    this.map.attributionControl.setPrefix('Leaflet');
  }

  private getBingLayer() {
    const bingMapsKey = '96S0sLgTrpX5VudevEyg~93qOp_-tPdiBcUw_Q-mpUg~AtbViWkzvmAlU9MB08o4mka92JlnRQnYHrHP8GKZBbl0caebqVS95jsvOKVHvrt3';
    const bingMapsOptions = {
      key: bingMapsKey,
      culture: this.getCultureForBingMaps(),
      ...this.commonLayerOptions,
    };
    const roadOnDemand = new L.bingLayer(L.extend({imagerySet: 'RoadOnDemand'}, bingMapsOptions));
    const aerial = new L.bingLayer(L.extend({imagerySet: 'Aerial'}, bingMapsOptions));
    const aerialWithLabelsOnDemand = new L.bingLayer(L.extend({imagerySet: 'AerialWithLabelsOnDemand'}, bingMapsOptions));
    return {roadOnDemand, aerial, aerialWithLabelsOnDemand};
  }

  private getCultureForBingMaps(): string {
    // navigator.language is used because it seems to match the supported culture code for Bing Maps.
    // For Bing Maps, it's still safe in case navigator.language does not match the supported culture code
    // because passing some random string for the culture option results in the default culture (en-US).
    // References:
    //  - navigator.language on MDN: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language
    //  - Bing Maps Supported Culture Codes: https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes
    return navigator.language;
  }

  private getOsmLayer() {
    return L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors, CC-BY-SA',
      ...this.commonLayerOptions,
    });
  }

  private renderMarkerClusterGroup(photos: Photo[]): void {
    const markerClusterGroup = L.markerClusterGroup();

    photos.forEach(photo => {
      const latLng = [photo.exif.gpsInfo.latLng.latitude, photo.exif.gpsInfo.latLng.longitude];
      const marker = L.marker(latLng).bindPopup(PhotoInfoViewerContent.request('leaflet-map', photo));
      markerClusterGroup.addLayer(marker);
    });

    this.map.addLayer(markerClusterGroup);
    this.map.fitBounds(markerClusterGroup.getBounds());
  }
}
