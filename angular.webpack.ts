import { CustomWebpackBrowserSchema } from '@angular-builders/custom-webpack';
import * as webpack from 'webpack';

// This is Custom Webpack Config Function.
// See https://www.npmjs.com/package/@angular-builders/custom-webpack#custom-webpack-config-function
export default (config: webpack.Configuration, options: CustomWebpackBrowserSchema) => {
  config.target = 'electron-renderer';
  config.experiments.topLevelAwait = true;
  return config;
};
