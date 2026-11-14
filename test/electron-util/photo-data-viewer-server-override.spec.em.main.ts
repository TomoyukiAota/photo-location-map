import assert from 'assert';
import { photoDataViewerServerOverride } from '../../electron-util/photo-data-viewer-server-override.js';

describe('photoDataViewerServerOverride', () => {
  it('leaves an ordinary launch, without a test profile, on the production viewer', () => {
    assert.strictEqual(photoDataViewerServerOverride({ PLM_TEST_PHOTO_DATA_VIEWER_SERVER: 'http://127.0.0.1:3130' }), undefined);
    assert.strictEqual(photoDataViewerServerOverride({}), undefined);
  });

  it('serves a test profile from a loopback origin', () => {
    assert.strictEqual(photoDataViewerServerOverride({ PLM_TEST_ROOT: '/tmp/profile', PLM_TEST_PHOTO_DATA_VIEWER_SERVER: 'http://127.0.0.1:3130' }),
      'http://127.0.0.1:3130/');
    assert.strictEqual(photoDataViewerServerOverride({ PLM_TEST_ROOT: '/tmp/profile', PLM_TEST_PHOTO_DATA_VIEWER_SERVER: 'http://localhost:3100/' }),
      'http://localhost:3100/');
  });

  it('refuses anything but the origin of a loopback HTTP server', () => {
    for (const server of ['https://pdv-in-plm.vercel.app', 'http://example.com:3130', 'http://127.0.0.1:3130/path', 'http://127.0.0.1:3130/?q=1', 'file:///tmp/viewer']) {
      assert.throws(() => photoDataViewerServerOverride({ PLM_TEST_ROOT: '/tmp/profile', PLM_TEST_PHOTO_DATA_VIEWER_SERVER: server }), /loopback/);
    }
  });
});
