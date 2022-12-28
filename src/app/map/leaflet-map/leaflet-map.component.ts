import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import * as turf from '@turf/turf';
import { Control, LayersControlEvent, Map, Marker } from 'leaflet';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { DirectoryTreeViewSelectionService } from "../../directory-tree-view/directory-tree-view-selection.service";
import { Photo } from '../../shared/model/photo.model';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { LeafletMapForceRenderService } from './leaflet-map-force-render/leaflet-map-force-render.service';

// References to implement Bing Maps with leaflet-plugins:
// - https://github.com/shramov/leaflet-plugins/blob/master/examples/bing.html
// - https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js
import 'leaflet-plugins/layer/tile/Bing'; // Equivalent to <script src="https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js"></script>
import 'leaflet-plugins/layer/tile/Bing.addon.applyMaxNativeZoom';

// "declare let L: any;" is defined here (in addition to global scope typing given by type-declaration/index.d.ts)
// in order to avoid the compile errors for the types from leaflet.markercluster
declare let L: any;

interface RegionInfo extends Control {
  updateContent(): RegionInfo;
}

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
  private photos: Photo[] = [];
  private photosWithinRegion: Set<Photo> = new Set<Photo>();
  private regionInfo: RegionInfo;

  private get selectedBaseLayerName(): string {
    return UserDataStorage.readOrDefault(UserDataStoragePath.LeafletMap.SelectedLayer, null);
  }
  private set selectedBaseLayerName(layerName: string) {
    UserDataStorage.write(UserDataStoragePath.LeafletMap.SelectedLayer, layerName);
    Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Changed Base Layer`, `Changed Base Layer to "${layerName}"`);
  }

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private forceRenderService: LeafletMapForceRenderService,
              private selectedPhotoService: SelectedPhotoService) {
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
    this.photos = photos;

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
    this.map = L.map('leaflet-map', {zoomControl: false}).setView([0, 0], 2);
    this.configureZoom();
    L.control.scale().addTo(this.map);
    this.configureAttribution();
    this.configureBaseLayer();
    this.configureRegionSelector();
  }

  private configureZoom() {
    L.control.zoom({position: 'bottomright'}).addTo(this.map);
    this.configureInitialMaxZoomLevel();
  }

  private configureInitialMaxZoomLevel() {
    this.map.once('moveend', event => {
      const initialMaxZoomLevel = 13;
      if (this.map.getZoom() > initialMaxZoomLevel) {
        this.map.setZoom(initialMaxZoomLevel);
      }
    });
  }

  private configureAttribution(): void {
    // Manually set to 'Leaflet' without the URL link.
    // The default is 'Leaflet' with the link to https://leafletjs.com/
    // The page will be opened within the application window, which confuses users.
    this.map.attributionControl.setPrefix('Leaflet');
  }

  private configureBaseLayer() {
    const bingLayer = this.getBingLayer();
    const osmLayer = this.getOsmLayer();
    const baseLayers = {
      'Bing (Road)': bingLayer.roadOnDemand,
      'Bing (Aerial)': bingLayer.aerial,
      'Bing (Aerial with Labels)': bingLayer.aerialWithLabelsOnDemand,
      'OpenStreetMap': osmLayer,
    };
    L.control.layers(baseLayers, null, {position: 'topleft'}).addTo(this.map);

    const previousLayer = baseLayers[this.selectedBaseLayerName];
    const defaultLayer = bingLayer.roadOnDemand;
    const selectedLayer = previousLayer ?? defaultLayer;
    selectedLayer.addTo(this.map);

    this.map.on('baselayerchange', (event: LayersControlEvent) => {
      this.selectedBaseLayerName = event.name;
    });
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

  private configureRegionSelector() {
    this.configureRegionInfo(() => this.getRegionInfoContent());
    this.configureLeafletGeoman();
    this.updateRegionInfo();
  }

  private configureRegionInfo(getContent: () => HTMLElement) {
    L.RegionInfo = L.Control.extend({
      // Control::onAdd required for Leaflet
      onAdd: function(map) {
        this._div = L.DomUtil.create('div', 'plm-leaflet-map-region-info leaflet-bar');
        L.DomEvent.disableClickPropagation(this._div);
        return this._div;
      },
      // RegionInfo::updateContent
      updateContent: function() {
        this._div.replaceChildren(getContent());
        return this;
      },
    });

    L.regionInfo = function(opts) {
      return new L.RegionInfo(opts);
    };

    this.regionInfo = L.regionInfo({ position: 'topright' }).addTo(this.map);
  }

  private getRegionInfoContent(): HTMLElement {
    const container = document.createElement('div');

    const text = document.createElement('div');
    text.innerText = `Number of photos in regions: ${this.photosWithinRegion.size}`;

    const button = document.createElement('button');
    button.innerText = 'Select Photos In Regions';
    button.disabled = this.photosWithinRegion.size === 0;
    button.onclick = () => {
      const photoPaths = Array.from(this.photosWithinRegion).map(photo => photo.path);
      this.directoryTreeViewSelectionService.select(photoPaths);
    };

    container.append(text, button);
    return container;
  }

  private configureLeafletGeoman() {
    (this.map as any).pm.addControls({
      position: 'topright',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawCircle: false,
      cutPolygon: false,
      rotateMode: false,
      oneBlock: true,
    });

    (this.map as any).on('pm:create', (e) => this.onGeomanLayerCreated(e));
    (this.map as any).on('pm:remove', () => this.onGeomanLayerRemoved());

    const customTranslation = {
      buttonTitles: {
        drawRectButton: 'Set Rectangle Region',
        drawPolyButton: 'Set Polygon Region',
        drawTextButton: 'Set Text',
        editButton: 'Edit Region',
        dragButton: 'Drag Region',
        deleteButton: 'Remove Region',
      },
    };
    (this.map as any).pm.setLang('customTranslation', customTranslation, 'en');
  }

  private onGeomanLayerCreated(e) {
    this.updateRegionInfo();
    e.layer.on('pm:change', () => this.onGeomanLayerChanged());
  }

  private onGeomanLayerChanged = _.throttle(() => this.updateRegionInfo(), 200 /* ms */);

  private onGeomanLayerRemoved() {
    this.updateRegionInfo();
  }

  private updateRegionInfo() {
    console.log('updateRegionInfo');
    this.updatePhotosWithinRegion();
    this.regionInfo.updateContent();
  }

  private updatePhotosWithinRegion() {
    this.photosWithinRegion = new Set<Photo>();
    const allLayers = L.PM.Utils.findLayers(this.map);
    const targetLayers = allLayers.filter(layer => layer._drawnByGeoman);
    targetLayers.forEach(layer => {
      const geoJsonFeature = layer.toGeoJSON();
      if (geoJsonFeature.geometry.type !== 'Polygon') return;
      const photosWithinLayer = this.photos.filter(photo => {
        const {latitude, longitude} = photo.exif.gpsInfo.latLng;
        return turf.booleanWithin(turf.point([longitude, latitude]), geoJsonFeature);
      });
      photosWithinLayer.forEach(photo => this.photosWithinRegion.add(photo));
    });
    console.log('photosWithinRegion', this.photosWithinRegion);
  }

  private renderMarkerClusterGroup(photos: Photo[]): void {
    if (photos.length === 1) {
      this.renderMarkerClusterGroupForSinglePhoto(photos[0]);
    } else {
      this.renderMarkerClusterGroupForMultiplePhotos(photos);
    }
  }

  private renderMarkerClusterGroupForSinglePhoto(photo: Photo): void {
    const markerClusterGroup = L.markerClusterGroup({ animate: false }); // { animate: false } because animation does not look good for single photo case.
    const marker = this.addMarkerToMarkerClusterGroup(markerClusterGroup, photo);
    this.map.addLayer(markerClusterGroup);
    this.map.fitBounds(markerClusterGroup.getBounds());

    // For single photo case, open the popup with centering in the map.
    this.configureCenteringIncludingPopupAndMarker();
    marker.openPopup();
  }

  private renderMarkerClusterGroupForMultiplePhotos(photos: Photo[]): void {
    const markerClusterGroup = L.markerClusterGroup({ animate: true }); // { animate: true } because animation looks good for multiple photo case.
    photos.forEach(photo => {
      this.addMarkerToMarkerClusterGroup(markerClusterGroup, photo);
    });
    this.map.addLayer(markerClusterGroup);
    this.map.fitBounds(markerClusterGroup.getBounds());
  }

  private addMarkerToMarkerClusterGroup(markerClusterGroup: any, photo: Photo) {
    const latLng: [number, number] = [photo.exif.gpsInfo.latLng.latitude, photo.exif.gpsInfo.latLng.longitude];
    const marker: Marker = L.marker(latLng);
    marker.bindPopup(PhotoInfoViewerContent.request('leaflet-map', photo));
    markerClusterGroup.addLayer(marker);
    return marker;
  }

  private configureCenteringIncludingPopupAndMarker() {
    // The code in this function is based on the Stack Overflow answer in https://stackoverflow.com/a/23960984/7947548
    // There are 2 major changes from the Stack Overflow answer:
    // 1) 'popupopen' event is handled only once using map.once (not map.on).
    //    Centering including the popup and the marker is needed only when the map for the selected photo is initially displayed.
    //    Using map.on results in centering always happening when the marker is clicked, which does not look good.
    // 2) {animate: false} is passed to map.panTo function because the animation does not look good.
    // Other changes are minor changes (e.g. using const instead of var).
    this.map.once('popupopen', (e) => {
      const px = this.map.project(e.target._popup._latlng);    // find the pixel location on the map where the popup anchor is
      px.y -= e.target._popup._container.clientHeight/2;       // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
      this.map.panTo(this.map.unproject(px),{animate: false}); // pan to new center
    });
  }
}
