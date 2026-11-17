import assert from 'assert';
import { modifyUrlForAnalyticsIfNeeded } from '../../../src-main/photo-data-viewer/launch-photo-data-viewer.js';

describe('modifyUrlForAnalyticsIfNeeded (in main process)', () => {
  it('records a link of the viewer to Google Maps, Street View or Google Earth without the photo\'s place', () => {
    // The addresses that Photo Data Viewer's buttons open (src/components/photo-data/row/LatLngRow.tsx there).
    assert.strictEqual(modifyUrlForAnalyticsIfNeeded('https://maps.google.com/?q=34.69,135.19&ll=34.69,135.19&z=14'),
      'URL including https://maps.google.com/');
    assert.strictEqual(
      modifyUrlForAnalyticsIfNeeded('https://www.google.com/maps/@?api=1&map_action=pano&parameters&viewpoint=34.69,135.19'),
      'URL including https://www.google.com/maps/');
    assert.strictEqual(modifyUrlForAnalyticsIfNeeded('https://earth.google.com/web/search/34.69,135.19'),
      'URL including https://earth.google.com/');
  });

  it('records another link of the viewer as it is', () => {
    assert.strictEqual(modifyUrlForAnalyticsIfNeeded('https://github.com/TomoyukiAota/photo-data-viewer'),
      'https://github.com/TomoyukiAota/photo-data-viewer');
  });
});
