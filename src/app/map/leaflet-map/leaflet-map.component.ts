import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as turf from '@turf/turf';
import { Control, LayersControlEvent, LeafletEvent, Map, Marker, PopupEvent } from 'leaflet';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { Photo } from '../../shared/model/photo.model';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';
import { PhotoClusterViewer } from '../../photo-cluster-viewer/photo-cluster-viewer';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { LeafletMapForceRenderService } from './leaflet-map-force-render/leaflet-map-force-render.service';
import { createDivIconHtml } from './div-icon';
import { leafletMapLogger as logger } from './leaflet-map-logger';

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
export class LeafletMapComponent implements OnDestroy, AfterViewInit {
  @ViewChild('updateInProgressOverlay') public updateInProgressOverlay: ElementRef<HTMLDivElement>;
  private pinnedPhotoServiceSubscription: Subscription;
  private forceRenderServiceSubscription: Subscription;
  private readonly commonLayerOptions = {
    maxNativeZoom: 19,
    maxZoom: 19,
  };
  private map: Map;
  private regionInfo: RegionInfo;
  private photos: Photo[] = [];
  private photosWithinRegion: Set<Photo> = new Set<Photo>();

  private get selectedBaseLayerName(): string {
    return UserDataStorage.readOrDefault(UserDataStoragePath.LeafletMap.SelectedBaseLayer, null);
  }
  private set selectedBaseLayerName(baseLayerName: string) {
    UserDataStorage.write(UserDataStoragePath.LeafletMap.SelectedBaseLayer, baseLayerName);
    Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Changed Base Layer`, `Changed Base Layer to "${baseLayerName}"`);
  }

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private forceRenderService: LeafletMapForceRenderService,
              private pinnedPhotoService: PinnedPhotoService) {
  }

  public ngAfterViewInit(): void {
    this.pinnedPhotoServiceSubscription = this.pinnedPhotoService.pinnedPhotos.subscribe(
      photos => this.updateMap(photos)
    );
    this.forceRenderServiceSubscription = this.forceRenderService.forceRenderWithoutPhotoHappened.subscribe(
      () => this.updateMap([])
    );

    const photos = this.pinnedPhotoService.getPinnedPhotos();
    this.updateMap(photos);
  }

  public ngOnDestroy(): void {
    this.pinnedPhotoServiceSubscription.unsubscribe();
    this.forceRenderServiceSubscription.unsubscribe();
  }

  private updateMap(photos: Photo[]): void {
    this.updateInProgressOverlay.nativeElement.style.visibility = 'visible';
    this.updateInProgressOverlay.nativeElement.style.opacity = '1';
    this.changeDetectorRef.detectChanges(); // To show the overlay. Needed because change detection does not work in case the same photos are pinned.
    this.renderMapWithDebouncing(photos);
  }

  // renderMap function needs debouncing.
  // Otherwise, changing pinned photos in a short time results in sending frequent requests to Bing Maps.
  // In that case, Bing.js emits the "Your request could not be completed because of too many requests." error,
  // and the map becomes empty.
  private renderMapWithDebouncing = _.debounce((photos: Photo[]) => {
    this.renderMap(photos);
    this.updateInProgressOverlay.nativeElement.style.visibility = 'hidden';
    this.updateInProgressOverlay.nativeElement.style.opacity = '0';
    this.changeDetectorRef.detectChanges(); // To hide the overlay.
  }, 1000 /* ms */);

  private renderMap(photos: Photo[]): void {
    this.ensureMapRemoved();
    this.initializeMap();
    this.photos = photos;

    if (photos.length > 0) {
      this.renderMarkerClusterGroup(photos);
    }
  }

  private ensureMapRemoved(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  }

  private initializeMap(): void {
    this.map = L.map('plm-leaflet-map', {zoomControl: false}).setView([0, 0], 2);
    this.configureAttribution();
    this.configureScale();
    this.configureZoom();
    this.configureBaseLayer();
    this.configureRegionSelector();
  }

  private configureAttribution(): void {
    // Manually set to 'Leaflet' without the URL link.
    // The default is 'Leaflet' with the link to https://leafletjs.com/
    // The page will be opened within the application window, which confuses users.
    this.map.attributionControl.setPrefix('Leaflet');
  }

  private configureScale() {
    L.control.scale({position: 'bottomright'}).addTo(this.map);
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

  private configureBaseLayer() {
    const bingLayer = this.getBingLayer();
    const osmLayer = this.getOsmLayer();
    const baseLayers = {
      'Bing (Road)': bingLayer.roadOnDemand,
      'Bing (Aerial)': bingLayer.aerial,
      'Bing (Aerial with Labels)': bingLayer.aerialWithLabelsOnDemand,
      'OpenStreetMap': osmLayer,
    };
    L.control.layers(baseLayers, null, {position: 'topright'}).addTo(this.map);

    const previousBaseLayer = baseLayers[this.selectedBaseLayerName];
    const defaultBaseLayer = bingLayer.roadOnDemand;
    const selectedBaseLayer = previousBaseLayer ?? defaultBaseLayer;
    selectedBaseLayer.addTo(this.map);

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
    this.configureRegionInfo();
    this.configureLeafletGeoman();
    this.updateRegionInfo();
  }

  private configureRegionInfo() {
    const getContent = () => this.getRegionInfoContent();
    L.RegionInfo = L.Control.extend({
      // Control::onAdd required for Leaflet
      onAdd: function(map) {
        this._div = L.DomUtil.create('div', 'leaflet-bar plm-leaflet-map-region-info');
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

    this.regionInfo = L.regionInfo({ position: 'bottomleft' }).addTo(this.map);
    this.hideRegionInfo();
  }

  private hideRegionInfo() {
    this.regionInfo.getContainer().style.visibility = 'hidden';
  }

  private showRegionInfo() {
    this.regionInfo.getContainer().style.visibility = 'visible';
  }

  private getRegionInfoContent(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('plm-leaflet-map-region-info-container');

    const text = document.createElement('div');
    text.classList.add('plm-leaflet-map-region-info-text');
    text.innerText = `Photos in Regions: ${this.photosWithinRegion.size}`;

    const button = document.createElement('button');
    button.classList.add('plm-leaflet-map-region-info-select-photos-button');
    button.innerText = 'Select Photos';
    button.disabled = this.photosWithinRegion.size === 0;
    button.onclick = () => {
      logger.info(`Select Photos in Regions, Photos: ${this.photosWithinRegion.size}, Regions: ${this.getNumberOfRegions()}`);
      Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Select Photos in Regions`, `Photos: ${this.photosWithinRegion.size}, Regions: ${this.getNumberOfRegions()}`);
      const photoPaths = Array.from(this.photosWithinRegion).map(photo => photo.path);
      this.directoryTreeViewSelectionService.select(photoPaths);
    };

    container.append(text, button);
    return container;
  }

  private configureLeafletGeoman() {
    (this.map as any).pm.addControls({
      position: 'bottomright',
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
        drawRectButton: 'Set Region by Rectangle',
        drawPolyButton: 'Set Region by Vertex',
        drawTextButton: 'Set Text',
        editButton: 'Edit Region',
        dragButton: 'Drag Region',
        deleteButton: 'Remove Region',
      },
    };
    (this.map as any).pm.setLang('customTranslation', customTranslation, 'en');
  }

  private onGeomanLayerCreated(e) {
    e.layer.on('pm:change', () => this.onGeomanLayerChanged());
    this.updateRegionInfo();
    if (this.regionExists()) {
      this.showRegionInfo();
    }
    const geometryType = e?.layer?.toGeoJSON?.()?.geometry?.type;
    logger.info(`Create Geoman Layer, layer.geoJson.geometry.type: ${geometryType}`);
    Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Create Geoman Layer`, `layer.geoJson.geometry.type: ${geometryType}`);
  }

  private onGeomanLayerChanged = _.throttle(() => this.updateRegionInfo(), 200 /* ms */);

  private onGeomanLayerRemoved() {
    if (!this.regionExists()) {
      this.hideRegionInfo();
    }
    this.updateRegionInfo();
    logger.info(`Remove Geoman Layer`);
    Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Remove Geoman Layer`);
  }

  private updateRegionInfo() {
    this.updatePhotosWithinRegion();
    this.regionInfo.updateContent();
  }

  private regionExists(): boolean {
    return this.getNumberOfRegions() > 0;
  }

  private getNumberOfRegions(): number {
    return this.getGeoJsonPolygons().length;
  }

  private getGeoJsonPolygons() {
    return this.getLayersDrawnByGeoman()
      .map(layer => layer.toGeoJSON())
      .filter(geoJson => geoJson.geometry.type === 'Polygon');
  }

  private getLayersDrawnByGeoman() {
    const layers = L.PM.Utils.findLayers(this.map);
    const layersDrawnByGeoman = layers.filter(layer => layer._drawnByGeoman);
    return layersDrawnByGeoman;
  }

  private updatePhotosWithinRegion() {
    this.photosWithinRegion = new Set<Photo>();
    const geoJsonPolygons = this.getGeoJsonPolygons();
    geoJsonPolygons.forEach(geoJsonPolygon => {
      const photosWithinPolygon = this.photos.filter(photo => {
        const {latitude, longitude} = photo.exif.gpsInfo.latLng;
        return turf.booleanWithin(turf.point([longitude, latitude]), geoJsonPolygon);
      });
      photosWithinPolygon.forEach(photo => this.photosWithinRegion.add(photo));
    });
  }

  private renderMarkerClusterGroup(photos: Photo[]): void {
    if (photos.length === 1) {
      this.renderMarkerClusterGroupForSinglePhoto(photos[0]);
    } else {
      this.renderMarkerClusterGroupForMultiplePhotos(photos);
    }
  }

  private renderMarkerClusterGroupForSinglePhoto(photo: Photo): void {
    const markerClusterGroup = L.markerClusterGroup({ animate: false }); // Animation does not look good for single photo case.
    const marker = this.addMarkerToMarkerClusterGroup(markerClusterGroup, photo);
    this.map.addLayer(markerClusterGroup);
    this.map.fitBounds(markerClusterGroup.getBounds());

    // For single photo case, open the popup with centering in the map.
    this.configureCenteringIncludingPopupAndMarker();
    marker.openPopup();
  }

  private renderMarkerClusterGroupForMultiplePhotos(photos: Photo[]): void {
    const markerClusterGroup = L.markerClusterGroup({
      animate: true,              // Animation looks good for multiple photo case.
      maxClusterRadius: 120,      // Increase cluster radius so that markers are either clustered or individually placed without overlaps.
      spiderfyOnMaxZoom: false,   // Disable spiderfy
      zoomToBoundsOnClick: false  // Disable Leaflet.MarkerCluster's zoom behavior. Instead, this app controls zoom using cluster.zoomToBounds() with clusterclick event.
    });
    photos.forEach(photo => {
      this.addMarkerToMarkerClusterGroup(markerClusterGroup, photo);
    });
    markerClusterGroup.on('clusterclick',  e => this.handleClusterClick(e));
    this.map.addLayer(markerClusterGroup);
    this.map.fitBounds(markerClusterGroup.getBounds());
  }

  // When a marker cluster is clicked, this function is called.
  // This function zooms or shows a popup.
  // The condition to zoom or to show a popup corresponds with
  // the condition to call cluster.zoomToBounds() or cluster.spiderfy() in Leaflet.markercluster's source code.
  // Permalink to Leaflet.markercluster's repo as of Feb 3, 2023:
  // https://github.com/Leaflet/Leaflet.markercluster/blob/b2512acb4dcf444352ea258472ae05871c12eda7/src/MarkerClusterGroup.js#L856-L886
  private handleClusterClick(e: LeafletEvent) {
    const cluster = e.layer;
    if (cluster._childClusters.length >= 2) {
      cluster.zoomToBounds();
      return;
    }
    if (cluster._childClusters.length === 1) {
      let bottomCluster = cluster;
      while (bottomCluster._childClusters.length === 1) {
        bottomCluster = bottomCluster._childClusters[0];
      }
      // Named as originalSpiderfyCondition because this is the condition when cluster.spiderfy() is called in Leaflet.markercluster
      const originalSpiderfyCondition = bottomCluster._zoom === this.map.getMaxZoom() && bottomCluster._childCount === cluster._childCount;
      if (!originalSpiderfyCondition) {
        cluster.zoomToBounds();
        return;
      }
    }
    // The code above handles the case to zoom, which is to call cluster.zoomToBounds().
    // The code below handles the case to show a popup, which corresponds with calling cluster.spiderfy() in Leaflet.markercluster.
    this.showPopupForMarkerCluster(cluster);
  }

  private showPopupForMarkerCluster(cluster) {
    const markers = cluster.getAllChildMarkers();
    const photos = markers.map(marker => marker.options.photo);
    const popupContent = PhotoClusterViewer.create(photos);
    L.popup({
      maxWidth: 100000,   // Set to some large number so that there is no maxWidth limit.
      offset: L.point(0, -10),
    }).setLatLng(cluster.getLatLng())
      .setContent(popupContent)
      .openOn(this.map);
  }

  private addMarkerToMarkerClusterGroup(markerClusterGroup: any, photo: Photo) {
    const latLng: [number, number] = [photo.exif.gpsInfo.latLng.latitude, photo.exif.gpsInfo.latLng.longitude];
    const marker: Marker = L.marker(latLng,
      {
        icon: L.divIcon({
          popupAnchor: [0, -35],
          className: 'plm-leaflet-map-div-icon', // Get rid of the default leaflet-div-icon class.
          html: createDivIconHtml(photo),
        })
      }
    );
    marker.bindPopup(PhotoInfoViewerContent.request('leaflet-map-popup', photo));
    marker.on('popupopen',  event => this.updateDivIconBackgroundColor(event, 'rgba( 63,  81, 181, .15)')); // Same as $white-background_selected in _color.scss
    marker.on('popupclose', event => this.updateDivIconBackgroundColor(event, 'rgba(255, 255, 255, 1  )'));
    (marker.options as any).photo = photo;
    markerClusterGroup.addLayer(marker);
    return marker;
  }

  private updateDivIconBackgroundColor(event: PopupEvent, color: string) {
    const divIconHtml: HTMLDivElement = event.target.options.icon.options.html;
    const contentContainer = divIconHtml.querySelector('.plm-leaflet-map-div-icon-content-container') as HTMLDivElement;
    contentContainer.style.backgroundColor = color;
  }

  private configureCenteringIncludingPopupAndMarker() {
    // The code in this function is based on the Stack Overflow answer in https://stackoverflow.com/a/23960984/7947548
    // There are 2 major changes from the Stack Overflow answer:
    // 1) 'popupopen' event is handled only once using map.once (not map.on).
    //    Centering including the popup and the marker is needed only when the map is initially displayed.
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
