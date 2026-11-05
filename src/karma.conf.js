// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const electronWebPreferences = require('../electron-util/electron-web-preferences');

// TL;DR: Load Jasmine as classic scripts; compiled tests/polyfills stay ES modules.
// Details: Angular's application Karma builder changes every included .js file to
// type=module to order Zone.js/testing after Jasmine. Jasmine 6 detects that as
// unsupported. These tests use native async setup without the Jasmine Zone patch,
// so its browser runtime/boot files can run first as classic scripts. Restore
// their types after Angular configures them, whenever Karma refreshes its files.
function classicJasmineScripts(emitter) {
  const jasmineScript = /[\\/](?:jasmine-core[\\/]lib[\\/]jasmine-core|karma-jasmine[\\/]lib|karma-jasmine-html-reporter[\\/]src)[\\/][^\\/]+\.js$/;
  emitter.on('file_list_modified', files => {
    for (const file of files.included) {
      if (jasmineScript.test(file.originalPath)) file.type = 'js';
    }
  });
}
classicJasmineScripts.$inject = ['emitter'];

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'plm-classic-jasmine'],
    plugins: [
      { 'framework:plm-classic-jasmine': ['factory', classicJasmineScripts] },
      require('karma-jasmine'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-electron'),
      require('karma-mocha-reporter')
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      useIframe: false
    },
    coverageReporter: {
      dir: require('path').join(__dirname, '../coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'lcovonly' }]
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
    // The application builder emits native ES modules. karma-electron's
    // CommonJS preprocessor wraps scripts in a function, which makes their
    // import/export statements invalid. The launcher already enables Node.js.
    singleRun: true,
    captureTimeout: 180000,             // Increased from 60000 ms (default) to 180000 ms for CI using GitHub Actions.
    browserNoActivityTimeout: 120000,   // Increased from 30000 ms (default) to 120000 ms for CI using GitHub Actions.
    browserDisconnectTimeout: 10000,    // For the intermittent error "Disconnected reconnect failed before timeout of 2000ms (ping timeout)" on macOS in GitHub Actions.
    browserDisconnectTolerance: 3,      // For the intermittent error "Disconnected reconnect failed before timeout of 2000ms (ping timeout)" on macOS in GitHub Actions.
  });
};
