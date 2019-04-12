import assert = require('assert');
import { LogFileWriter } from '../../../src-shared/log/log-file-writer';
import { LogFileConfig } from '../../../src-shared/log/log-file-config';
import * as fs from 'fs';

describe('LogFileWriter (in main process)', () => {
  it('a log file should be created and a message should be written', async () => {
    const message = 'Message from LogFileWriter unit test in main process.';
    const writer = new LogFileWriter();
    await writer.append(message);
    assert(fs.existsSync(LogFileConfig.filePath) === true);
    assert(fs.statSync(LogFileConfig.filePath).isFile() === true);
    assert(fs.readFileSync(LogFileConfig.filePath, 'utf8').includes(message) === true);
  });
});
