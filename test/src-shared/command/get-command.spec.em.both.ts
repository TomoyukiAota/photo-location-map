import assert = require('assert');
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { Command } from '../../../src-shared/command/command';

const os = ProxyRequire.os;

describe('Command', () => {
  it('toRunAssociatedApp should create the command', () => {
    const path = './Path/To/Somewhere';
    let expectedCommand: string = null;

    switch (os.platform()) {
      case 'win32':
        expectedCommand = `explorer "${path}"`;
        break;
      case 'darwin':
        expectedCommand = `open "${path}"`;
        break;
      case 'linux':
        expectedCommand = `xdg-open "${path}"`;
        break;
    }

    const actualCommand = Command.toRunAssociatedApp(path);
    assert(actualCommand === expectedCommand);
  });


  it('toOpenContainingFolder should create the command', () => {
    const path = './Path/To/Somewhere';
    let expectedCommand: string = null;

    switch (os.platform()) {
      case 'win32':
        expectedCommand = `explorer /select,"${path}"`;
        break;
      case 'darwin':
        expectedCommand = `open -R "${path}"`;
        break;
      case 'linux':
        expectedCommand = `nautilus "${path}"`;
        break;
    }

    const actualCommand = Command.toOpenContainingFolder(path);
    assert(actualCommand === expectedCommand);
  });
});
