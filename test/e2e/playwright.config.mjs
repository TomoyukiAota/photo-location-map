import { defineConfig } from 'playwright/test';

// The screenshots are compared with the references in snapshots/, or in the folder of test/e2e that
// PLM_VISUAL_REFERENCES names, such as the one that CI on macOS keeps for its runner (README.md).
const screenshotReferences = process.env.PLM_VISUAL_REFERENCES || 'snapshots';

// TL;DR: CI runs the suite in two parts at once, each on a runner of its own, and PLM_E2E_SHARD names the part, such as
// "1/2", for Playwright's shard option (.github/workflows/ci-on-*.yml).
// Details: fullyParallel lets a shard take some of the cases of the suite's one spec file: without it, Playwright gives
// each shard whole files. As the file has a beforeAll hook, Playwright cuts its cases, in their order, into as many
// blocks as there are shards, of the same number of cases, which also halved the time of the suite on each OS. With one
// worker, the cases still run one at a time, in their order, as they do without fullyParallel.
const [shardCurrent, shardTotal] = (process.env.PLM_E2E_SHARD ?? '').split('/').map(Number);

export default defineConfig({
  testDir: '.', testMatch: '*.spec.mjs', workers: 1, fullyParallel: true, timeout: 60000,
  shard: shardTotal ? { current: shardCurrent, total: shardTotal } : null,
  outputDir: '../../.upgrade-artifacts/e2e-results',
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  updateSnapshots: 'none',
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      animations: 'disabled', maxDiffPixelRatio: 0.001, pathTemplate: `{testDir}/${screenshotReferences}/{arg}{ext}`,
    },
  },
  reporter: [['list']],
});
