// OpenHistoricalMap's maplibre-gl-dates publishes no types: the function that the map of a date uses
// (src/app/map/leaflet-map/dated-layers/open-historical-map-layer.ts).
declare module '@openhistoricalmap/maplibre-gl-dates' {
  /** Keeps the features that existed on `date`, YYYY-MM-DD or a Date, in every layer of the map's style. */
  export function filterByDate(map: import('maplibre-gl').Map, date: string | Date): void;
}
