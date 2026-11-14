import { AfterViewInit, Component, ComponentRef, ElementRef, Injector, OnDestroy, effect, untracked, viewChild, inject } from '@angular/core';
import * as turf from '@turf/turf';
import { Control, LayersControlEvent, LeafletEvent, Map, Marker, PopupEvent } from 'leaflet';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { recordUnhandledError } from '../../../../src-shared/analytics/record-error';
import { currentLanguage, t } from '../../../../src-shared/i18n/i18n';
import { getLanguage } from '../../../../src-shared/i18n/languages';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { Photo } from '../../shared/model/photo.model';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';
import { PhotoClusterViewerComponent } from '../../photo-cluster-viewer/photo-cluster-viewer.component';
import { PhotoInfoViewerComponent } from '../../photo-info-viewer/photo-info-viewer.component';
import { LeafletMapForceRenderService } from './leaflet-map-force-render/leaflet-map-force-render.service';
import { addEachMarker } from './add-each-marker';
import { createDivIconHtml } from './div-icon';
import { LeafletContentService } from './leaflet-content.service';
import { leafletMapLogger as logger } from './leaflet-map-logger';
import { rasterTileBaseLayerConfigsVersion1 } from './raster-tile-base-layer-configs-version-1';
import { RegionInfoComponent } from './region-info/region-info.component';
import { MatProgressBar } from '@angular/material/progress-bar';

// "declare let L: any;" is defined here (in addition to global scope typing given by types/index.d.ts)
// in order to avoid the compile errors for the types from leaflet.markercluster
declare let L: any;

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss'],
  imports: [MatProgressBar]
})
export class LeafletMapComponent implements OnDestroy, AfterViewInit {
  private directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private forceRenderService = inject(LeafletMapForceRenderService);
  private injector = inject(Injector);
  private leafletContentService = inject(LeafletContentService);
  private pinnedPhotoService = inject(PinnedPhotoService);

  public readonly updateInProgressOverlay = viewChild.required<ElementRef<HTMLDivElement>>('updateInProgressOverlay');
  private forceRenderServiceSubscription: Subscription;

  private readonly commonBaseLayerOptions = {
    // Set the common max zoom level for all base layers.
    // Otherwise, as of Dec 31, 2024, switching base layers breaks marker cluster functionalities as follows:
    // Issue A:
    // Step 1) Using OpenStreetMap which has "maxZoom: 19", clicking a marker cluster shows a popup.
    // Step 2) Zoom out, switch to Esri World Imagery which has "maxZoom: 18", and then clicking the marker cluster does not show the popup.
    // Issue B:
    // Step 1) Using Esri World Imagery which has "maxZoom: 18", clicking a marker cluster shows a popup.
    // Step 2) Switch to OpenStreetMap which has "maxZoom: 19", and then zooming in results in showing markers (pins) for individual photos without clusters.
    maxZoom: 19,
  };

  private map: Map;
  private regionInfo: Control;
  private regionInfoContent: ComponentRef<RegionInfoComponent>;
  // The viewer of each cluster whose popup has been opened on this map, which the cluster's popup shows again.
  private clusterViewers = new WeakMap<object, ComponentRef<PhotoClusterViewerComponent>>();
  private photos: Photo[] = [];
  private photosWithinRegion: Set<Photo> = new Set<Photo>();

  private get selectedBaseLayerName(): string {
    return UserDataStorage.readOrDefault(UserDataStoragePath.LeafletMap.SelectedBaseLayer, null);
  }
  private set selectedBaseLayerName(baseLayerName: string) {
    UserDataStorage.write(UserDataStoragePath.LeafletMap.SelectedBaseLayer, baseLayerName);
    Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Changed Base Layer`, `Changed Base Layer to "${baseLayerName}"`);
  }

  public ngAfterViewInit(): void {
    // Render again whenever other photos are pinned; the first run renders the photos pinned now. Created here because
    // rendering needs the overlay and the map's container.
    effect(() => {
      const photos = [...this.pinnedPhotoService.pinnedPhotos()];
      untracked(() => this.updateMap(photos));
    }, { injector: this.injector });
    this.forceRenderServiceSubscription = this.forceRenderService.forceRenderWithoutPhotoHappened.subscribe(
      () => this.updateMap([])
    );
  }

  public ngOnDestroy(): void {
    this.forceRenderServiceSubscription.unsubscribe();
    // A render still waiting would draw into the removed view.
    this.renderMapWithDebouncing.cancel();
    this.leafletContentService.destroyAll();
  }

  // The overlay is shown and hidden through its style rather than a binding, so it needs no change detection.
  private updateMap(photos: Photo[]): void {
    const updateInProgressOverlay = this.updateInProgressOverlay();
    updateInProgressOverlay.nativeElement.style.visibility = 'visible';
    updateInProgressOverlay.nativeElement.style.opacity = '1';
    this.renderMapWithDebouncing(photos);
  }

  // renderMap function needs debouncing.
  // Otherwise, changing pinned photos in a short time results in sending frequent requests to the tile server.
  private renderMapWithDebouncing = _.debounce((photos: Photo[]) => {
    try {
      this.renderMap(photos);
    } finally {
      // Hidden even when rendering threw: the error is recorded as any other, and the overlay would stay over the map.
      const updateInProgressOverlay = this.updateInProgressOverlay();
      updateInProgressOverlay.nativeElement.style.visibility = 'hidden';
      updateInProgressOverlay.nativeElement.style.opacity = '0';
    }
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
    // The components that the removed map showed in its popups and its region info.
    this.leafletContentService.destroyAll();
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
    L.control.zoom({position: 'bottomright', zoomInTitle: t('map.zoomIn'), zoomOutTitle: t('map.zoomOut')}).addTo(this.map);
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
    const rasterTileBaseLayers = this.getRasterTileBaseLayers();
    const baseLayers = {
      ...rasterTileBaseLayers,
    };
    const layersControl: Control.Layers = L.control.layers(baseLayers, null, {position: 'topright'}).addTo(this.map);
    // Leaflet gives the control's button the tooltip "Layers", and no option to change it.
    layersControl.getContainer()?.querySelector('.leaflet-control-layers-toggle')?.setAttribute('title', t('map.layers'));

    const previousBaseLayer = baseLayers[this.selectedBaseLayerName];
    const defaultBaseLayer = Object.values(baseLayers)[0];
    const selectedBaseLayer = previousBaseLayer ?? defaultBaseLayer;
    selectedBaseLayer.addTo(this.map);

    this.map.on('baselayerchange', (event: LayersControlEvent) => {
      this.selectedBaseLayerName = event.name;
    });
  }

  private getRasterTileBaseLayers() {
    const tileLayers = {};
    rasterTileBaseLayerConfigsVersion1.rasterTileBaseLayerConfigs.forEach(config => {
      const tileLayer = L.tileLayer(config.url, {
        ...config.options,
        ...this.commonBaseLayerOptions,
      });
      tileLayers[config.name] = tileLayer;
    });
    return tileLayers;
  }

  private configureRegionSelector() {
    this.configureRegionInfo();
    this.configureLeafletGeoman();
    this.updateRegionInfo();
  }

  private configureRegionInfo() {
    this.regionInfoContent = this.leafletContentService.create(RegionInfoComponent, { photoCount: 0 });
    this.regionInfoContent.instance.selectPhotos.subscribe(() => this.selectPhotosWithinRegion());
    const content: HTMLElement = this.regionInfoContent.location.nativeElement;
    L.RegionInfo = L.Control.extend({
      // Control::onAdd required for Leaflet
      onAdd: function(map) {
        this._div = L.DomUtil.create('div', 'leaflet-bar plm-leaflet-map-region-info');
        L.DomEvent.disableClickPropagation(this._div);
        this._div.appendChild(content);
        return this._div;
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

  private selectPhotosWithinRegion(): void {
    logger.info(`Select Photos in Regions, Photos: ${this.photosWithinRegion.size}, Regions: ${this.getNumberOfRegions()}`);
    Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Select Photos in Regions`, `Photos: ${this.photosWithinRegion.size}, Regions: ${this.getNumberOfRegions()}`);
    const photoPaths = Array.from(this.photosWithinRegion).map(photo => photo.path);
    this.directoryTreeViewSelectionService.select(photoPaths);
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
        drawRectButton: t('map.setRegionByRectangle'),
        drawPolyButton: t('map.setRegionByVertex'),
        drawTextButton: t('map.setText'),
        editButton: t('map.editRegion'),
        dragButton: t('map.dragRegion'),
        deleteButton: t('map.removeRegion'),
      },
    };
    // The texts that are not set here, such as the tooltips while a region is drawn, are Leaflet-Geoman's own in the
    // application's language, or its English ones when it has no translation for the language.
    (this.map as any).pm.setLang('customTranslation', customTranslation, getLanguage(currentLanguage).geomanLocale);
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
    this.regionInfoContent.setInput('photoCount', this.photosWithinRegion.size);
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
    addEachMarker(photos,
      photo => this.addMarkerToMarkerClusterGroup(markerClusterGroup, photo),
      (error, photo) => {
        logger.errorNotRecorded(`Failed to add the marker of ${photo.path}`, error);
        recordUnhandledError(error, 'Renderer'); // Without its path, as any error nothing else handled.
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
    const photos: Photo[] = markers.map(marker => marker.options.photo);
    let viewer = this.clusterViewers.get(cluster);
    if (viewer) {
      // Given its photos again, the viewer chooses the first tile, as in a popup that is opened for the first time.
      viewer.setInput('photos', photos);
      viewer.changeDetectorRef.detectChanges();
    } else {
      viewer = this.leafletContentService.create(PhotoClusterViewerComponent, { photos });
      this.clusterViewers.set(cluster, viewer);
    }
    const popupContent: HTMLElement = viewer.location.nativeElement;
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
    // A function, which Leaflet calls when the popup opens, so that the content is made only for the photos shown.
    // The popup shows the same component when it opens again.
    let viewer: ComponentRef<PhotoInfoViewerComponent> | undefined;
    marker.bindPopup(() => {
      viewer ??= this.leafletContentService.create(PhotoInfoViewerComponent, { photo, place: 'leaflet-map-popup' });
      return viewer.location.nativeElement as HTMLElement;
    });
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
