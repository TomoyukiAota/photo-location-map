import { AfterViewInit, Component, ComponentRef, ElementRef, Injector, OnDestroy, Type, effect, untracked, viewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as turf from '@turf/turf';
import { Control, LayersControlEvent, LeafletEvent, Map as LeafletMap, Marker, Popup, PopupEvent } from 'leaflet';
import throttle from 'lodash-es/throttle.js';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { recordUnhandledError } from '../../../../src-shared/analytics/record-error';
import { currentLanguage, t } from '../../../../src-shared/i18n/i18n';
import { getLanguage } from '../../../../src-shared/i18n/languages';
import { logged } from '../../../../src-shared/log/logged-line';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { Photo } from '../../shared/model/photo.model';
import { PhotoRevealService } from '../../shared/service/photo-reveal.service';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';
import { PhotoClusterViewerComponent } from '../../photo-cluster-viewer/photo-cluster-viewer.component';
import { PhotoInfoViewerComponent } from '../../photo-info-viewer/photo-info-viewer.component';
import { addEachMarker } from './add-each-marker';
import { DatedLayers } from './dated-layers/dated-layers';
import { MapDateService } from './dated-layers/map-date.service';
import { createDivIconHtml } from './div-icon';
import { addMapFullScreenControl } from './full-screen/map-full-screen-control';
import { LeafletContentService } from './leaflet-content.service';
import { leafletMapLogger as logger } from './leaflet-map-logger';
import { hiddenBuiltInBaseLayersOf, rasterTileBaseLayerConfigsVersion1 } from './raster-tile-base-layer-configs-version-1';
import { RegionInfoComponent } from './region-info/region-info.component';
import { ClusteredMarker, viewToReveal } from './view-to-reveal';

// "declare let L: any;" is defined here (in addition to global scope typing given by types/index.d.ts)
// in order to avoid the compile errors for the types from leaflet.markercluster
declare let L: any;

/**
 * The highest zoom level that the map goes to by itself to show the photos pinned: a photo's place with what is
 * around it. A higher one that the user chose is kept while one photo follows another (renderMap()).
 */
const maxZoomToShowPhotos = 13;

/**
 * The map of the home view, with a marker for each photo pinned.
 * TL;DR: The map is made once, and stays as it is while other photos are pinned: its markers change, and its view
 * moves to them (renderMap()).
 * Details: The map, its base layer and the tiles that it has loaded, the regions drawn on it and its controls stay. It
 * was made again for every change of the pinned photos until November 2026, which loaded its tiles again, and dropped
 * the regions drawn.
 */
@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss'],
})
export class LeafletMapComponent implements OnDestroy, AfterViewInit {
  private directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private injector = inject(Injector);
  private leafletContentService = inject(LeafletContentService);
  private mapDateService = inject(MapDateService);
  private photoRevealService = inject(PhotoRevealService);
  private pinnedPhotoService = inject(PinnedPhotoService);

  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  // Tells Leaflet of each change of the map's size (watchSize()).
  private resizeObserver: ResizeObserver | null = null;
  // Makes the map, a moment after the home view is shown (makeMapLater()).
  private makeMapTimer: ReturnType<typeof setTimeout> | null = null;

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

  // Made by the first render (makeMapLater()), and kept until the component is destroyed.
  private map: LeafletMap | null = null;
  // The Leaflet.markercluster group of the photos on the map, and the marker of each of them by the photo's path.
  private markerClusterGroup: any = null;
  private readonly markers = new Map<string, Marker>();
  // The components that the popups of the markers and of their clusters show, which go with the markers.
  private readonly markerContents = new Set<ComponentRef<unknown>>();
  private regionInfo: Control;
  // The layers of a past date, and their control, for this map (dated-layers/dated-layers.ts).
  private datedLayers: DatedLayers | null = null;
  private regionInfoContent: ComponentRef<RegionInfoComponent>;
  // The viewer of each cluster whose popup has been opened on this map, which the cluster's popup shows again.
  private clusterViewers = new WeakMap<object, ComponentRef<PhotoClusterViewerComponent>>();
  private photos: Photo[] = [];
  private photosWithinRegion: Set<Photo> = new Set<Photo>();
  // What is needed to reveal a photo once the map shows it. The effect that asks the map to render the pinned photos
  // runs a moment after they change, and the render may wait for a moment more (renderMapWithThrottling), so a
  // request to reveal a photo that the request has just pinned comes before both.
  // - The photo to reveal, until the map shows the photos pinned now.
  private photoToReveal: Photo | null = null;
  // - The pinned photos that the map was last asked to render.
  private pinnedPhotosToRender: readonly Photo[] | null = null;
  // - Whether the map is about to render.
  private isRenderPending = false;

  constructor() {
    this.photoRevealService.revealInMapRequested
      .pipe(takeUntilDestroyed())
      .subscribe(photo => this.handleRevealInMapRequested(photo));
  }

  private get selectedBaseLayerName(): string {
    return UserDataStorage.readOrDefault(UserDataStoragePath.LeafletMap.SelectedBaseLayer, null);
  }
  private set selectedBaseLayerName(baseLayerName: string) {
    UserDataStorage.write(UserDataStoragePath.LeafletMap.SelectedBaseLayer, baseLayerName);
    Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Changed Base Layer`, `Changed Base Layer to "${baseLayerName}"`);
  }

  public ngAfterViewInit(): void {
    this.watchSize();
    // Renders the photos whenever other photos are pinned, once the map is made. Created here because the map needs its
    // container.
    effect(() => {
      const pinnedPhotos = this.pinnedPhotoService.pinnedPhotos();
      untracked(() => {
        this.pinnedPhotosToRender = pinnedPhotos;
        this.updateMap([...pinnedPhotos]);
      });
    }, { injector: this.injector });
    this.makeMapLater();
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    // A render still waiting would draw into the removed view.
    clearTimeout(this.makeMapTimer);
    this.renderMapWithThrottling.cancel();
    this.removeMap();
  }

  /**
   * Makes the map a second after the home view is shown, with the photos pinned then, as it was when every render of
   * the map waited for a second.
   * TL;DR: Making the map takes the page's main thread for a moment, which the window's first moments need.
   * Details: The dialogs that open with the window, the Language dialog at the first launch and the Welcome dialog,
   * take the focus at the end of their opening animation by a timer, and start the animation in the next frame. Made
   * between the two, the map would hold back the frame, so that the dialog took the focus still small, before its
   * animation. The e2e case of the Language dialog, which measures the dialog once it has the focus, saw that.
   */
  private makeMapLater(): void {
    this.makeMapTimer = setTimeout(() => {
      this.makeMapTimer = null;
      this.renderMapWithThrottling([...(this.pinnedPhotosToRender ?? [])]);
    }, 1000 /* ms */);
  }

  /**
   * Tells Leaflet of each change of the map's size, as Split.js lays the home view out and as the gutters around the
   * map are dragged: Leaflet measures its container by itself only when the window is resized. Its center stays.
   */
  private watchSize(): void {
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize({ debounceMoveend: true }));
    this.resizeObserver.observe(this.mapContainer().nativeElement);
  }

  private updateMap(photos: Photo[]): void {
    this.isRenderPending = true;
    // Until the map is made, which renders the photos pinned then.
    if (this.map)
      this.renderMapWithThrottling(photos);
  }

  /**
   * Renders the photos at once, and, when other photos are pinned within the next 300 ms, the last of them at the end
   * of that time: a key held down, or clicks in a row, would otherwise move the map many times a second, and load the
   * tiles of each of its views.
   */
  private renderMapWithThrottling = throttle((photos: Photo[]) => {
    try {
      this.renderMap(photos);
    } finally {
      this.isRenderPending = false;
    }
    this.revealPhotoToReveal();
  }, 300 /* ms */);

  /**
   * Shows the photos in place of those that the map showed: only the markers change, and the view moves to them, as
   * it did when the map was made for them, without an animation, as Reveal in Map moves it.
   * - Several photos: the view fits them, at maxZoomToShowPhotos at the most.
   * - One photo: its popup opens in the middle of the map, at maxZoomToShowPhotos; or at the map's zoom when the map
   *   showed one photo before, as Photo Taken Before and Photo Taken After go from one photo to the next.
   * - No photo: the view stays.
   * The regions drawn on the map count the photos again, and the layers of a past date follow their dates.
   */
  private renderMap(photos: Photo[]): void {
    const showedOnePhoto = this.map !== null && this.photos.length === 1;
    this.removeMarkers();
    // Before the map is made, as the layers of a past date take their date from the photos when they are added.
    this.photos = photos;
    if (!this.map)
      this.initializeMap();

    if (photos.length === 1)
      this.renderMarkerClusterGroupForSinglePhoto(photos[0], showedOnePhoto);
    else if (photos.length > 1)
      this.renderMarkerClusterGroupForMultiplePhotos(photos);
    this.updateRegionInfo();
    this.datedLayers.photosChanged();
  }

  /**
   * Takes the markers off the map, with the popup that is open and the components that their popups showed. The popup
   * goes at once, as Leaflet's fade would show it for 200 ms without its component (_plm-leaflet-map.scss).
   */
  private removeMarkers(): void {
    this.map?.closePopup();
    if (this.markerClusterGroup)
      this.map.removeLayer(this.markerClusterGroup);
    this.markerClusterGroup = null;
    this.markers.clear();
    this.clusterViewers = new WeakMap();
    for (const content of this.markerContents)
      content.destroy();
    this.markerContents.clear();
  }

  private removeMap(): void {
    this.datedLayers?.destroy();
    this.datedLayers = null;
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }
    this.markerClusterGroup = null;
    this.markers.clear();
    this.markerContents.clear();
    // The components that the map showed: in its popups, its region info and its control of a past date.
    this.leafletContentService.destroyAll();
  }

  /** A component for a popup of a marker or of a cluster, which goes when the markers do (removeMarkers()). */
  private createMarkerContent<C>(component: Type<C>, inputs: Readonly<Record<string, unknown>>): ComponentRef<C> {
    const content = this.leafletContentService.create(component, inputs);
    this.markerContents.add(content);
    return content;
  }

  private initializeMap(): void {
    this.map = L.map(this.mapContainer().nativeElement, {zoomControl: false}).setView([0, 0], 2);
    this.configureAttribution();
    this.configureScale();
    this.configureZoom();
    addMapFullScreenControl(this.map, this.leafletContentService);
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
  }

  private configureBaseLayer() {
    const rasterTileBaseLayers = this.getRasterTileBaseLayers();
    // The layers of a past date come after those of the list, which the app downloads, and which can hide them.
    const datedLayers = new DatedLayers(this.map, this.mapDateService, this.leafletContentService, () => this.photos,
      this.commonBaseLayerOptions, hiddenBuiltInBaseLayersOf(rasterTileBaseLayerConfigsVersion1));
    this.datedLayers = datedLayers;
    const baseLayers = {
      ...rasterTileBaseLayers,
      ...datedLayers.baseLayers,
    };
    const layersControl: Control.Layers = L.control.layers(baseLayers, null, {position: 'topright'}).addTo(this.map);
    // Leaflet gives the control's button the tooltip "Layers", and no option to change it.
    layersControl.getContainer()?.querySelector('.leaflet-control-layers-toggle')?.setAttribute('title', t('map.layers'));

    // A layer chosen before that is not offered now, as one that the list hides, gives way to the first one. It stays
    // the one saved until the user chooses another, so that it is shown again once it is offered again.
    const previousBaseLayer = baseLayers[this.selectedBaseLayerName];
    const defaultBaseLayer = Object.values(baseLayers)[0];
    const selectedBaseLayer = previousBaseLayer ?? defaultBaseLayer;
    selectedBaseLayer.addTo(this.map);
    datedLayers.baseLayerChanged(selectedBaseLayer);

    this.map.on('baselayerchange', (event: LayersControlEvent) => {
      this.selectedBaseLayerName = event.name;
      datedLayers.baseLayerChanged(event.layer);
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

  private onGeomanLayerChanged = throttle(() => this.updateRegionInfo(), 200 /* ms */);

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

  /**
   * The photo's marker, with its popup open in the middle of the map: at maxZoomToShowPhotos, or at the map's zoom when
   * `keepZoom`. The view is set before the group is added, which then adds the marker, in view.
   */
  private renderMarkerClusterGroupForSinglePhoto(photo: Photo, keepZoom: boolean): void {
    const markerClusterGroup = L.markerClusterGroup({ animate: false }); // Animation does not look good for single photo case.
    const marker = this.addMarkerToMarkerClusterGroup(markerClusterGroup, photo);
    this.markerClusterGroup = markerClusterGroup;
    this.map.setView(marker.getLatLng(), keepZoom ? this.map.getZoom() : maxZoomToShowPhotos, { animate: false });
    this.map.addLayer(markerClusterGroup);
    marker.openPopup();
    this.centerOnPopup(marker.getPopup());
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
    this.markerClusterGroup = markerClusterGroup;
    // Before the group is added, which then clusters the markers at the zoom of the view that shows them.
    this.map.fitBounds(markerClusterGroup.getBounds(), { maxZoom: maxZoomToShowPhotos, animate: false });
    this.map.addLayer(markerClusterGroup);
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

  /** Opens the popup of a cluster's photos, with the tile of the photo given chosen, or of the first one without. */
  private showPopupForMarkerCluster(cluster, chosenPhoto: Photo | null = null): Popup {
    const markers = cluster.getAllChildMarkers();
    const photos: Photo[] = markers.map(marker => marker.options.photo);
    let viewer = this.clusterViewers.get(cluster);
    if (viewer) {
      // Given its photos again, the viewer chooses the tile given, or the first one, as in a popup that is opened for
      // the first time.
      viewer.setInput('photos', photos);
      viewer.setInput('chosenPhoto', chosenPhoto);
      viewer.changeDetectorRef.detectChanges();
    } else {
      viewer = this.createMarkerContent(PhotoClusterViewerComponent, { photos, chosenPhoto });
      this.clusterViewers.set(cluster, viewer);
    }
    const popupContent: HTMLElement = viewer.location.nativeElement;
    return L.popup({
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
      viewer ??= this.createMarkerContent(PhotoInfoViewerComponent, { photo, place: 'leaflet-map-popup' });
      return viewer.location.nativeElement as HTMLElement;
    });
    marker.on('popupopen',  event => this.updateDivIconBackgroundColor(event, 'rgba( 63,  81, 181, .15)')); // Same as $white-background_selected in _color.scss
    marker.on('popupclose', event => this.updateDivIconBackgroundColor(event, 'rgba(255, 255, 255, 1  )'));
    (marker.options as any).photo = photo;
    markerClusterGroup.addLayer(marker);
    this.markers.set(photo.path, marker);
    return marker;
  }

  private updateDivIconBackgroundColor(event: PopupEvent, color: string) {
    const divIconHtml: HTMLDivElement = event.target.options.icon.options.html;
    const contentContainer = divIconHtml.querySelector('.plm-leaflet-map-div-icon-content-container') as HTMLDivElement;
    contentContainer.style.backgroundColor = color;
  }

  /**
   * Pans the map without an animation, so that the popup and its marker are in the middle of the map: for the popup of
   * a photo that the map renders alone, or reveals, rather than for one that a click on a marker opens, where the map
   * would move under the pointer. Based on the Stack Overflow answer in https://stackoverflow.com/a/23960984/7947548,
   * without the animation of its pan, which does not look good.
   */
  private centerOnPopup(popup: Popup) {
    const px = this.map.project(popup.getLatLng());          // find the pixel location on the map where the popup anchor is
    px.y -= popup.getElement().clientHeight/2;               // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
    this.map.panTo(this.map.unproject(px),{animate: false}); // pan to new center
  }

  //#region --- Reveal ---
  /** A request to reveal a photo, which is pinned by then (PhotoRevealService.revealInMap()). */
  private handleRevealInMapRequested(photo: Photo): void {
    logger.info(`Reveal ${photo.path}`);
    this.photoToReveal = photo;
    this.revealPhotoToReveal();
  }

  /** Whether the map shows the photos that are pinned now, with no render to come. */
  private showsPinnedPhotos(): boolean {
    return !this.isRenderPending && this.pinnedPhotosToRender === this.pinnedPhotoService.pinnedPhotos();
  }

  /** Reveals the photo to reveal, once the map shows the photos pinned now: right away, or after it has rendered them. */
  private revealPhotoToReveal(): void {
    const photo = this.photoToReveal;
    if (!photo || !this.showsPinnedPhotos())
      return;

    this.photoToReveal = null;
    const marker = this.markers.get(photo.path);
    if (marker)
      this.revealMarker(marker, photo);
    else
      logger.warn(logged`Cannot reveal ${photo.path}, which is not on the map.`);
  }

  /**
   * Shows a photo's marker as a click on it shows it: with its popup open; or, for a photo taken at the place of
   * others, with the popup of their cluster, with the photo's tile chosen. The map moves there without an animation,
   * to the zoom level at which the marker or that cluster is shown (viewToReveal()), keeping a higher one, and the
   * popup is in the middle of the map, with its marker, as the popup of a folder's only photo is.
   */
  private revealMarker(marker: Marker, photo: Photo): void {
    const map = this.map;
    const markerClusterGroup = this.markerClusterGroup;
    this.whenStill(map, markerClusterGroup, () => {
      const view = viewToReveal(marker as unknown as ClusteredMarker, map.getMaxZoom());
      map.setView(view.center, Math.max(map.getZoom(), view.zoom), { animate: false });
      this.whenStill(map, markerClusterGroup, () => {
        const shown = markerClusterGroup.getVisibleParent(marker);
        if (shown === marker) {
          marker.openPopup();
          this.centerOnPopup(marker.getPopup());
        } else if (shown) {
          this.centerOnPopup(this.showPopupForMarkerCluster(shown, photo));
        } else {
          logger.warn(logged`Cannot reveal ${photo.path}, whose marker is not shown.`);
        }
      });
    });
  }

  /**
   * Calls `callback` once the map and its clusters have stopped moving, unless the map renders other markers before.
   * TL;DR: Leaflet does not change its view while it animates a zoom, and Leaflet.markercluster moves its markers for a
   * moment after each zoom.
   * Details:
   * - Leaflet ignores setView() while it animates a zoom (_tryAnimatedZoom() in leaflet/src/map/Map.js), such as the
   *   one to the initial maximum zoom level after the map has rendered photos close to each other. It starts that
   *   animation in the next animation frame, so this waits for a frame before it looks, and looks again after each
   *   move.
   * - Leaflet.markercluster splits and merges its clusters after a zoom, and moves the markers that come out of a
   *   cluster from the cluster's place to their own, for a moment after which it fires animationend.
   */
  private whenStill(map: LeafletMap, markerClusterGroup: any, callback: () => void): void {
    const check = () => requestAnimationFrame(() => {
      if (map !== this.map || markerClusterGroup !== this.markerClusterGroup)
        return; // Rendered again: the marker that was to be revealed is gone.
      if ((map as any)._animatingZoom)
        map.once('moveend', check);
      else if (markerClusterGroup?._inZoomAnimation > 0)
        markerClusterGroup.once('animationend', check);
      else
        callback();
    });
    check();
  }
  //#endregion --- Reveal ---
}
