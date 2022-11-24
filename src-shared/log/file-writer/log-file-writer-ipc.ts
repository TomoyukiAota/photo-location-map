import { ProxyRequire } from '../../require/proxy-require';
import { logFileWriterMain } from './log-file-writer-main';

class LogFileWriterIpcChannelName {
  public static readonly append = 'log-file-writer-append';
}

export class LogFileWriterIpcMain {
  private static ipcMain = ProxyRequire.electron.ipcMain;

  public static configureReceivingIpcFromRenderer() {
    this.ipcMain.on(
      LogFileWriterIpcChannelName.append,
      async (event, message) => {
        const fileWriter = await logFileWriterMain;
        await fileWriter.append(message);
      }
    );
  }
}

export class LogFileWriterIpcRenderer {
  private static ipcRenderer = ProxyRequire.electron.ipcRenderer;

  public static sendEventToMain(message: string) {
    this.ipcRenderer.send(
      LogFileWriterIpcChannelName.append,
      message,
    );
  }
}
