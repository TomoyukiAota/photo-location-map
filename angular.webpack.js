// This is Custom Webpack Config Function.
// See https://www.npmjs.com/package/@angular-builders/custom-webpack#custom-webpack-config-function
// config: Webpack Configuration Object
// options: "options" in angular.json
module.exports = (config, options) => {
  config.target = 'electron-renderer';
  return config;
};
