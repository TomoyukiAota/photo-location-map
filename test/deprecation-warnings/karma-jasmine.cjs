const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const FileList = require('karma/lib/file-list');

test('Karma refresh keeps Jasmine classic while compiled Angular tests remain modules', async () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-jasmine-files-'));
  try {
    const fixture = name => {
      const file = path.join(fixtureRoot, name);
      fs.writeFileSync(file, '');
      // Angular's builder uses POSIX-normalized Karma patterns on every OS.
      return { pattern: file.replaceAll('\\', '/'), included: true, served: true, watched: false, type: 'module' };
    };
    const main = fixture('test_main.js');
    const spec = fixture('spec-example.js');
    const polyfills = fixture('polyfills.js');
    const cleanup = fixture('jasmine-cleanup-0.js');
    let config;
    require('../../src/karma.conf')({ set(value) { config = value; } });
    config.files = [main, spec];

    // Exercise the installed framework/reporter plugins in Angular's order.
    require('karma-jasmine')['framework:jasmine'][1](config.files);
    const HtmlReporter = require('karma-jasmine-html-reporter')['reporter:kjhtml'][1];
    new HtmlReporter(config, () => {});
    const angularRoot = path.dirname(require.resolve('@angular/build/package.json'));
    const { AngularPolyfillsPlugin } = require(path.join(angularRoot,
      'src/builders/karma/polyfills-plugin.js'));
    const angularPlugin = AngularPolyfillsPlugin.createPlugin(polyfills, cleanup, []);
    angularPlugin['reporter:angular-polyfills'][1](config.files);

    const jasmineCore = path.join(require('jasmine-core').files.path, 'jasmine.js');
    assert.equal(config.files.find(file => path.normalize(file.pattern) === jasmineCore).type, 'module',
      'If Angular fixes the default, review docs/tasks/20261105_deprecation-warnings/JASMINE.md and remove the workaround');
    const emitter = new EventEmitter();
    const classicPlugin = config.plugins.find(plugin => plugin['framework:plm-classic-jasmine']);
    classicPlugin['framework:plm-classic-jasmine'][1](emitter);
    const files = new FileList(config.files, [], emitter, async () => {}, 0);

    for (let refresh = 0; refresh < 2; refresh++) {
      await files.refresh();
      const included = files.files.included;
      assert.equal(included.find(file => path.normalize(file.originalPath) === jasmineCore).type, 'js');
      for (const entry of [main, spec, polyfills, cleanup]) {
        assert.equal(included.find(file => path.normalize(file.originalPath) === path.normalize(entry.pattern)).type, 'module',
          `${path.basename(entry.pattern)} must remain an ES module`);
      }
    }
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
