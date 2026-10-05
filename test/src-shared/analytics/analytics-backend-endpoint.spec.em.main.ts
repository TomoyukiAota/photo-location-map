import assert = require('assert');
import { AnalyticsBackendEndpoint } from '../../../src-shared/analytics/config/analytics-backend-endpoint';

describe('AnalyticsBackendEndpoint', () => {
  it('select should return dev when launched through npm scripts', () => {
    assert.equal(AnalyticsBackendEndpoint.select(true, false), AnalyticsBackendEndpoint.dev);
    assert.equal(AnalyticsBackendEndpoint.select(true, true), AnalyticsBackendEndpoint.dev);
  });

  it('select should return dev for prerelease versions', () => {
    assert.equal(AnalyticsBackendEndpoint.select(false, true), AnalyticsBackendEndpoint.dev);
  });

  it('select should return prod for released versions', () => {
    assert.equal(AnalyticsBackendEndpoint.select(false, false), AnalyticsBackendEndpoint.prod);
  });

  it('dev and prod should be different HTTPS URLs', () => {
    assert.notEqual(AnalyticsBackendEndpoint.dev, AnalyticsBackendEndpoint.prod);
    assert.ok(AnalyticsBackendEndpoint.dev.startsWith('https://'));
    assert.ok(AnalyticsBackendEndpoint.prod.startsWith('https://'));
  });
});
