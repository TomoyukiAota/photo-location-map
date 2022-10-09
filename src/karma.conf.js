// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const electronWebPreferences = require('../electron-util/electron-web-preferences');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-electron'),
      require('karma-mocha-reporter')
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      useIframe: false
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, '../coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },
    reporters: ['mocha', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['CustomElectron'],
    customLaunchers: {
      CustomElectron: {
        base: 'Electron',
        browserWindowOptions: {
          webPreferences: electronWebPreferences,
        },
        require: __dirname + '/karma-electron-main-fixtures.js'
      }
    },
    preprocessors: {
      '**/*.js': ['electron']
    },
    singleRun: true,
    captureTimeout: 180000,             // Increased from 60000 ms (default) to 180000 ms for CI using GitHub Actions.
    browserNoActivityTimeout: 120000,   // Increased from 30000 ms (default) to 120000 ms for CI using GitHub Actions.
    browserDisconnectTimeout: 10000,    // For the intermittent error "Disconnected reconnect failed before timeout of 2000ms (ping timeout)" on macOS in GitHub Actions.
    browserDisconnectTolerance: 3,      // For the intermittent error "Disconnected reconnect failed before timeout of 2000ms (ping timeout)" on macOS in GitHub Actions.
  });
};
