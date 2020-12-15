import assert = require('assert');
import * as os from 'os';
import { CommandString } from '../../../src-shared/command/command-string';

describe('CommandString', () => {
  it('toOpenWithAssociatedApp should return the command string', () => {
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

    const actualCommand = CommandString.toOpenWithAssociatedApp(path);
    assert(actualCommand === expectedCommand);
  });


  it('toOpenContainingFolder should return the command string', () => {
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

    const actualCommand = CommandString.toOpenContainingFolder(path);
    assert(actualCommand === expectedCommand);
  });
});
