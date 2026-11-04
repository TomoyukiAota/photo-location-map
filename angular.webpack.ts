import { CustomWebpackBrowserSchema } from '@angular-builders/custom-webpack';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as webpack from 'webpack';

// This is Custom Webpack Config Function.
// See https://www.npmjs.com/package/@angular-builders/custom-webpack#custom-webpack-config-function
export default (config: webpack.Configuration, options: CustomWebpackBrowserSchema) => {
  config.experiments ??= {};
  config.experiments.topLevelAwait = true;
  config.target = 'electron-renderer';

  // TL;DR: Bundle ECharts' production build, the same one for ngx-echarts and for the v5 theme.
  // Details: The official v5 theme (echarts/theme/v5.js) is a UMD file. webpack takes its AMD branch, which asks for
  // 'echarts', and the package's "require" condition resolves that to dist/echarts.js, ECharts' development build. Its
  // debug checks and console warnings sit behind a condition that is always true, so minification keeps them. The theme
  // has to register on the instance that ngx-echarts draws with (app.module.ts), or the chart gets ECharts 6's colors.
  // Resolving 'echarts' to dist/echarts.min.js gives both the production build.
  config.resolve = { ...config.resolve, alias: { ...config.resolve?.alias, echarts$: 'echarts/dist/echarts.min' } };

  // TL;DR: Discard the build cache whenever this file changes.
  // Details: Angular names its webpack cache after its version and the build options, not after this file, and webpack
  // keeps how the modules in node_modules resolved. After the alias above was added, a build that reused the cache still
  // gave the v5 theme dist/echarts.js, so the theme registered on a second copy of ECharts, not the one that draws the
  // chart. CI starts without a cache; the signed mac build is made locally, with one.
  if (typeof config.cache === 'object' && config.cache.type === 'filesystem') {
    config.cache.version = createHash('sha256').update(config.cache.version ?? '').update(readFileSync(__filename))
      .digest('hex');
  }
  return config;
};
