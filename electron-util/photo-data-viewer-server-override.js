// TL;DR: A test can serve Photo Data Viewer from a local build, with PLM_TEST_PHOTO_DATA_VIEWER_SERVER set to its
// http://127.0.0.1:<port> or http://localhost:<port> origin, to measure and test the app against a known build.
// Details: View Data loads the viewer from its production server (src-main/photo-data-viewer/), which is deployed
// apart from this app and can change between two runs. Only a test profile (PLM_TEST_ROOT) reads the variable, and
// only a loopback origin is accepted, so an ordinary launch always loads the production viewer.

/**
 * The origin to load Photo Data Viewer from instead of its production server, or undefined for an ordinary launch.
 * @param {Record<string, string | undefined>} env
 * @returns {string | undefined}
 */
export function photoDataViewerServerOverride(env) {
  const server = env.PLM_TEST_PHOTO_DATA_VIEWER_SERVER;
  if (!env.PLM_TEST_ROOT || !server) return undefined;
  const url = new URL(server);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/'
      || url.search || url.hash) {
    throw new Error('PLM_TEST_PHOTO_DATA_VIEWER_SERVER must be the origin of a loopback HTTP server.');
  }
  return url.href;
}
