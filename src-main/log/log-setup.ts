import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Now } from '../../src-shared/date-time/now.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { LogFileConfig } from '../../src-shared/log/file-config/log-file-config.js';
import { LogFileWriterInterface } from '../../src-shared/log/file-writer/log-file-writer-interface.js';
import { useLogFileWriter } from '../../src-shared/log/file-writer/log-file-writer.js';
import { isFromMainWindow } from '../ipc/ipc-sender.js';

// TL;DR: The log file, set up before anything else logs (src-main/electron-main.ts).
// Details: A renderer sends its lines through its preload (electron-util/preload/main-window.cjs). The file is opened
// at the first line, which the app writes as it starts; unit tests, which write none, leave no file.

class LogFileWriterMain implements LogFileWriterInterface {
  private fileHandle: Promise<fs.promises.FileHandle> | undefined;

  constructor(private readonly dirName: string, private readonly filePath: string) {
  }

  private opened(): Promise<fs.promises.FileHandle> {
    this.fileHandle ??= (async () => {
      await fs.promises.mkdir(this.dirName, { recursive: true }); // The directory needs to be created before calling fs.promises.open function.
      const fileSystemFlag = 'a'; // 'a' is for "Open file for appending. The file is created if it does not exist." See https://nodejs.org/api/fs.html
      return fs.promises.open(this.filePath, fileSystemFlag);
    })().catch(error => {
      this.fileHandle = undefined; // So that a later line tries again, as after a disk that was full.
      throw error;
    });
    return this.fileHandle;
  }

  public async append(message: string): Promise<void> {
    await (await this.opened()).appendFile(message + os.EOL);
  }
}

const logDirectory = path.join(app.getPath('appData'), 'Photo Location Map', 'logs');
LogFileConfig.setup(logDirectory, `${Now.basicFormat}_photo-location-map_log.txt`, path.sep);
const writer = new LogFileWriterMain(LogFileConfig.dirName, LogFileConfig.filePath);
useLogFileWriter(writer);

ipcMain.on(IpcConstants.Log.Append, (event, message: unknown) => {
  if (isFromMainWindow(event) && typeof message === 'string')
    writer.append(message).catch(error => console.error('A line of the renderer could not be written to the log file.', error));
});
