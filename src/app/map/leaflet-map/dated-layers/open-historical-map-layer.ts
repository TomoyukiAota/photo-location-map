import type { Map as MapLibreMap } from 'maplibre-gl';
import { openHistoricalMapUrls } from '../../../../../src-shared/map/dated-layer-urls';

// Leaflet and its plugins are the global L of angular.json's scripts.
declare let L: any;

/** The worker of MapLibre, a file of the app's build: angular.json copies it to assets/maplibre/. */
const workerUrl = () => new URL('assets/maplibre/maplibre-gl-worker.mjs', document.baseURI).href;

/** What the layer tells the map about. */
export interface OpenHistoricalMapLayerOptions {
  /** The date that the map shows, as YYYY-MM-DD. */
  date: string;
  attribution: string;
  /** The highest zoom that the map has while this is its base layer, as the other base layers give it. */
  maxZoom: number;
  /** The map could not be shown, as when the computer has no WebGL 2, or its style could not be loaded. */
  onError: (error: unknown) => void;
}

/** The layer that shows OpenHistoricalMap at a date. */
export interface OpenHistoricalMapLayer {
  /** Shows the map at another date, YYYY-MM-DD. */
  setDate(date: string): void;
}

/**
 * OpenHistoricalMap at a date, as a layer of the Leaflet map: MapLibre GL JS draws its vector tiles in a canvas that
 * follows the Leaflet map, and OpenHistoricalMap's own plugin, maplibre-gl-dates, keeps the features of that date.
 * TL;DR: The layer is the app's own, as the MapLibre GL Leaflet binding, which OpenHistoricalMap's documentation
 * names, would load a second Leaflet over the one of the map.
 * Details:
 * - OpenHistoricalMap publishes no raster tiles: its features have the dates when they came and went, and the map of a
 *   date is drawn from vector tiles (https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Reuse).
 * - @maplibre/maplibre-gl-leaflet imports "leaflet" as a module. The app has Leaflet as a global script, with
 *   Leaflet.markercluster and Leaflet-Geoman added to that L; the module of the binding would be bundled as a second
 *   Leaflet, which sets the global L to itself when it is evaluated, without the plugins. Its UMD build, as a script,
 *   takes MapLibre from a global maplibregl when it is loaded, which MapLibre 6, an ES module, does not set. So this
 *   layer does what the binding does, with the global L: it puts the canvas in the tile pane, moves it to the
 *   visible part of the map, and gives MapLibre the map's center and zoom, minus one, as MapLibre's tiles are of 512
 *   pixels; during a zoom's animation, it scales the canvas as Leaflet scales its own tiles.
 * - MapLibre, about 1 MB, and its worker are loaded when the layer is first shown, not with the app.
 */
export function openHistoricalMapLayer(options: OpenHistoricalMapLayerOptions): OpenHistoricalMapLayer {
  const Layer = L.Layer.extend({
    options: { attribution: options.attribution, maxZoom: options.maxZoom, pane: 'tilePane' },

    initialize(this: any) {
      this._date = options.date;
      this._update = L.Util.throttle(this._move, 32, this);
    },

    // The map's zoom is limited by its layers' maxZoom, as Leaflet's tile layers have it limited.
    beforeAdd(this: any, map: any) {
      map._addZoomLimit(this);
    },

    onAdd(this: any, map: any) {
      this._container = L.DomUtil.create('div', 'plm-leaflet-map-maplibre-container leaflet-zoom-animated');
      map.getPane(this.options.pane).appendChild(this._container);
      this._fitContainer();
      this._loading = this._createGlMap(map);
    },

    onRemove(this: any, map: any) {
      map._removeZoomLimit(this);
      this._glMap?.remove();
      this._glMap = null;
      this._styleLoaded = false;
      this._container.remove();
      this._container = null;
    },

    getEvents(this: any) {
      return { move: this._update, zoomanim: this._animateZoom, zoomend: this._zoomEnd, resize: this._resize };
    },

    async _createGlMap(this: any, map: any) {
      try {
        const [maplibre, datesModule] = await Promise.all([import('maplibre-gl'), import('@openhistoricalmap/maplibre-gl-dates')]);
        if (this._map !== map)
          return; // Removed while MapLibre was loading.
        // A CommonJS module, whose exports the bundle gives as the default export of the module.
        type Dates = typeof import('@openhistoricalmap/maplibre-gl-dates');
        const dates: Dates = (datesModule as unknown as { default?: Dates }).default ?? datesModule;
        maplibre.setWorkerUrl(workerUrl());
        const center = map.getCenter();
        const glMap: MapLibreMap = new maplibre.Map({
          container: this._container,
          style: openHistoricalMapUrls.style,
          center: [center.lng, center.lat],
          zoom: map.getZoom() - 1,
          interactive: false,
          // The attribution is Leaflet's, with those of the other layers.
          attributionControl: false,
        });
        // Leaflet's view is the one to follow, beyond the latitudes and zooms that MapLibre would keep to, as the binding
        // does.
        glMap.setTransformConstrain((constrainedCenter, constrainedZoom) => ({ center: constrainedCenter, zoom: constrainedZoom }));
        this._glMap = glMap;
        this._filterByDate = (date: string) => {
          try {
            dates.filterByDate(glMap, date);
          } catch (error) {
            options.onError(error);
          }
        };
        // TL;DR: Filtered once the style's layers are there, and at each date after.
        // Details: isStyleLoaded() is also false while tiles load, so a flag tells that the style has loaded. MapLibre
        // loads the style again after it has lost its WebGL context, which takes the filter away: it is applied again.
        glMap.on('style.load', () => {
          this._styleLoaded = true;
          this._filterByDate(this._date);
        });
        // The style or a tile that cannot be loaded. MapLibre goes on with what it has, so only the style ends the map.
        glMap.on('error', event => {
          if (!this._styleLoaded)
            options.onError(event.error);
        });
      } catch (error) {
        options.onError(error);
      }
    },

    setDate(this: any, date: string) {
      this._date = date;
      if (this._styleLoaded)
        this._filterByDate(date);
    },

    /** The container, as large as the map and where the map's visible part is, without a transform. */
    _fitContainer(this: any) {
      const size = this._map.getSize();
      this._container.style.width = `${size.x}px`;
      this._container.style.height = `${size.y}px`;
      L.DomUtil.setPosition(this._container, this._map.containerPointToLayerPoint([0, 0]));
    },

    _move(this: any) {
      if (!this._map || this._zooming)
        return;
      this._fitContainer();
      const center = this._map.getCenter();
      this._glMap?.jumpTo({ center: [center.lng, center.lat], zoom: this._map.getZoom() - 1 });
    },

    /** Scales the canvas during the animation of a zoom, as Leaflet does its tiles, from the map's top left corner. */
    _animateZoom(this: any, event: any) {
      this._zooming = true;
      const scale = this._map.getZoomScale(event.zoom);
      const topLeft = this._map.containerPointToLatLng([0, 0]);
      const offset = this._map._latLngToNewLayerPoint(topLeft, event.zoom, event.center);
      L.DomUtil.setTransform(this._container, offset, scale);
    },

    _zoomEnd(this: any) {
      this._zooming = false;
      this._move();
    },

    _resize(this: any) {
      this._fitContainer();
      this._glMap?.resize();
      this._move();
    },
  });
  return new Layer();
}
