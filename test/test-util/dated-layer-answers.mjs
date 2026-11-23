// What Esri World Imagery Wayback and OpenHistoricalMap answer for the ring of EXPO 2025, as they answered on
// 2026-11-21, for the map's layers of a past date (src/app/map/leaflet-map/dated-layers/). The e2e suite and the
// layout tool answer the app's requests with these, so that neither depends on those servers, and the page's
// Content Security Policy still decides what it may ask for.

const metadata = name => `https://metadata.maptiles.arcgis.com/arcgis/rest/services/World_Imagery_Metadata_${name}/MapServer`;

/** Six of Wayback's releases, by number: when each was published, and the name of its metadata service. */
const releases = {
  3692: ['2026-11-18', '2026_r11'],
  49059: ['2026-04-30', '2026_r04'],
  22869: ['2026-03-26', '2026_r03'],
  49999: ['2025-07-31', '2025_r07'],
  6543: ['2025-03-27', '2025_r03'],
  52930: ['2024-05-09', '2024_r05'],
};
const config = Object.fromEntries(Object.entries(releases).map(([number, [date, name]]) =>
  [number, { itemTitle: `World Imagery (Wayback ${date})`, metadataLayerUrl: metadata(name) }]));
/** For each release asked, the release in which the tile at the ring last changed. */
const tilemaps = { 3692: 49059, 22869: 49999, 6543: 52930 };
/** The sources of the imagery at the ring, by metadata service: when they were taken, and the zooms they are shown at. */
const sources = {
  '2026_r04': [['20251127', 13, 19]],
  '2025_r07': [['20250421', 16, 19], ['20240824', 12, 15]],
  '2024_r05': [['20230910', 12, 19]],
};
/** A style of one color for OpenHistoricalMap, which MapLibre draws without tiles, glyphs or sprites. */
export const oneColorStyle = { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#4b8bbe' } }] };
/** A tile: an image of one pixel. */
const tile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const hosts = ['s3-us-west-2.amazonaws.com', 'wayback.maptiles.arcgis.com', 'metadata.maptiles.arcgis.com', 'server.arcgisonline.com',
  'www.openhistoricalmap.org'];

/**
 * Answers the page's requests to those servers with these: the list of releases, the tilemaps, the metadata, the
 * tiles and OpenHistoricalMap's style; anything else of them fails. Gives the releases of the Wayback tiles that the
 * page asks for, in order. `held`, a promise, holds the answers of Wayback's list of releases and of its metadata until
 * it resolves, so that the dates are seen loading, at any zoom.
 */
export async function answerDatedLayers(page, { held } = {}) {
  const tileReleases = [];
  await page.route(url => hosts.includes(url.hostname), async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/config.maptiles.arcgis.com/waybackconfig.json') {
      await held;
      return route.fulfill({ json: config });
    }
    const tilemap = /\/MapServer\/tilemap\/(\d+)\//.exec(url.pathname);
    if (tilemap)
      return route.fulfill({ json: tilemaps[tilemap[1]] ? { data: [1], select: [tilemaps[tilemap[1]]] } : { data: [1] } });
    const query = /\/World_Imagery_Metadata_(\w+)\/MapServer\/(\d+)\/query$/.exec(url.pathname);
    if (query) {
      await held;
      // The sources in the layer of a zoom, which are those shown at it (metadataLayerOf() in wayback.ts).
      const zoom = 23 - Number(query[2]);
      const features = (sources[query[1]] ?? []).filter(([, min, max]) => min <= zoom && zoom <= max)
        .map(([date, min, max]) => ({ attributes: { SRC_DATE: Number(date), MinMapLevel: min, MaxMapLevel: max } }));
      // A held request may have been stopped meanwhile, as a lookup is once the map no longer waits for it
      // (MapDateService), and cannot be answered then.
      return route.fulfill({ json: { features } }).catch(error => {
        if (!held)
          throw error;
      });
    }
    const waybackTile = /\/WMTS\/1\.0\.0\/default028mm\/MapServer\/tile\/(\d+)\//.exec(url.pathname);
    if (url.hostname === 'wayback.maptiles.arcgis.com' && waybackTile) {
      tileReleases.push(Number(waybackTile[1]));
      return route.fulfill({ body: tile, contentType: 'image/png' });
    }
    if (url.hostname === 'server.arcgisonline.com')
      return route.fulfill({ body: tile, contentType: 'image/png' });
    if (url.pathname === '/map-styles/main/main.json')
      return route.fulfill({ json: oneColorStyle });
    return route.abort();
  });
  return tileReleases;
}
