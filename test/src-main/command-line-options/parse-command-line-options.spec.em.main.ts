import assert from 'assert';
import { spawnSync } from 'child_process';
import * as path from 'path';
import { Command, CommanderError } from 'commander';
import { parseCommandLineOptions } from '../../../src-main/command-line-options/parse-command-line-options.js';
import { commandLineOptionsValue } from '../../../src-main/command-line-options/command-line-options-value.js';

describe('Command-line options', () => {
  let originalArgv: string[];
  let originalParse: typeof Command.prototype.parse;
  let originalValue: ReturnType<typeof commandLineOptionsValue.get>;
  let output: string;

  beforeEach(() => {
    originalArgv = process.argv;
    originalParse = Command.prototype.parse;
    originalValue = commandLineOptionsValue.get();
    output = '';
    // Keep the real parser, replacing only process exits and terminal output.
    Command.prototype.parse = function(argv, options) {
      this.exitOverride().configureOutput({
        writeOut: text => { output += text; },
        writeErr: text => { output += text; },
      });
      return originalParse.call(this, argv, options);
    };
  });

  afterEach(() => {
    process.argv = originalArgv;
    Command.prototype.parse = originalParse;
    commandLineOptionsValue.set(originalValue);
  });

  function parse(args: string[]) {
    process.argv = [process.execPath, ...(process.defaultApp ? ['photo-location-map'] : []), ...args];
    parseCommandLineOptions();
  }

  it('accepts the NSIS restart flag alongside existing options', () => {
    const folder = '/photos/Unicode 日本語 # %';
    parse(['--updated', '--open', folder, '--live-reload', 'unused-positional']);
    assert.equal(commandLineOptionsValue.get().open, folder);
    assert.equal(commandLineOptionsValue.get().liveReload, true);
    assert.equal(output, '');
  });

  it('reads the root of a drive or share whose last backslash Windows read as a quotation mark, and only on Windows', () => {
    if (process.platform === 'win32') {
      // Explorer runs `"<exe>" --open "C:\"` for the background of C:\, which Windows splits into --open and C:".
      parse(['--open', 'C:"']);
      assert.equal(commandLineOptionsValue.get().open, 'C:\\');
      parse(['--open', '\\\\server\\share"']);
      assert.equal(commandLineOptionsValue.get().open, '\\\\server\\share\\');
      parse(['--open', 'C:\\Photos']);
      assert.equal(commandLineOptionsValue.get().open, 'C:\\Photos');
    } else {
      // Elsewhere, a name can end with a quotation mark.
      parse(['--open', '/photos/say "hi"']);
      assert.equal(commandLineOptionsValue.get().open, '/photos/say "hi"');
    }
  });

  it('accepts a restart with only the NSIS flag', () => {
    parse(['--updated']);
    assert.equal(commandLineOptionsValue.get().open, undefined);
    assert.equal(commandLineOptionsValue.get().liveReload, undefined);
    assert.equal(output, '');
  });

  it('accepts the packaged NSIS argv shape without a separate entry path', () => {
    // The compiled modules of the parser, which the tests are compiled with (test/em.tsconfig.json), and which require()
    // loads as ES modules.
    const folder = path.join(import.meta.dirname, '..', '..', '..', 'src-main', 'command-line-options');
    const parser = path.join(folder, 'parse-command-line-options.js');
    const value = path.join(folder, 'command-line-options-value.js');
    // Electron's defaultApp property is read-only. Its Node mode naturally has
    // the same argv prefix as a packaged app, so exercise that real parser path.
    const script = [
      'require("node:assert/strict").equal(Boolean(process.defaultApp), false);',
      'process.argv = ' + JSON.stringify([process.execPath, '--updated', '--open', 'C:\\Photos\\folder']) + ';',
      'require(' + JSON.stringify(parser) + ').parseCommandLineOptions();',
      'console.info(JSON.stringify(require(' + JSON.stringify(value) + ').commandLineOptionsValue.get()));',
    ].join('\n');
    const child = spawnSync(process.execPath, ['-e', script], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8', timeout: 10000,
    });
    assert.ifError(child.error);
    assert.equal(child.status, 0, child.stderr);
    const parsed = JSON.parse(child.stdout);
    assert.equal(parsed.open, 'C:\\Photos\\folder');
    assert.equal(parsed.updated, true);
  });

  it('continues to reject unrelated unknown flags', () => {
    assert.throws(() => parse(['--updated', '--unexpected-updater-option']), (error: CommanderError) => {
      assert.equal(error.code, 'commander.unknownOption');
      assert.equal(error.exitCode, 1);
      return true;
    });
    assert.match(output, /unknown option '--unexpected-updater-option'/);
  });

  it('keeps internal runtime flags out of public help', () => {
    assert.throws(() => parse(['--help']), (error: CommanderError) => {
      assert.equal(error.code, 'commander.helpDisplayed');
      assert.equal(error.exitCode, 0);
      return true;
    });
    assert.match(output, /--open <path>/);
    assert.match(output, /-h, --help/);
    assert.doesNotMatch(output, /--updated|--live-reload|--no-sandbox/);
  });
});
