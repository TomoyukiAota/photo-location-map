import assert from 'assert';
import { AnalyticsBackendEndpoint } from '../../../src-shared/analytics/config/analytics-backend-endpoint.js';
import { CrashReportEndpoint } from '../../../src-shared/analytics/config/crash-report-endpoint.js';

describe('CrashReportEndpoint', () => {
  it('should choose dev or prod by the events\' rule', () => {
    for (const [isDev, isPrerelease] of [[true, false], [true, true], [false, true], [false, false]]) {
      const events = AnalyticsBackendEndpoint.select(isDev, isPrerelease);
      const crashes = CrashReportEndpoint.select(isDev, isPrerelease);
      assert.equal(new URL(crashes).host, new URL(events).host);
      assert.equal(crashes === CrashReportEndpoint.prod, events === AnalyticsBackendEndpoint.prod);
    }
  });

  it('should take the dumps at a path of their own on the events\' hosts, over HTTPS', () => {
    for (const endpoint of [CrashReportEndpoint.dev, CrashReportEndpoint.prod]) {
      const url = new URL(endpoint);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.pathname, '/v1/crashes');
    }
    assert.notEqual(CrashReportEndpoint.dev, CrashReportEndpoint.prod);
  });
});
