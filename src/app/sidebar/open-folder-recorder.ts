import * as moment from 'moment';
import 'moment-duration-format'; // To use moment.duration().format()
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';

export class OpenFolderRecorder {
  private static readonly perfMeasureName = 'OpenFolder';
  private static readonly perfStartMarkName = 'OpenFolder:start';
  private static readonly perfEndMarkName = 'OpenFolder:end';

  private static openedFolderPath: string;

  public static start(openedFolderPath: string): void {
    this.clearPerf();
    this.openedFolderPath = openedFolderPath;
    Logger.info(`Opened Folder: ${openedFolderPath}`);
    Analytics.trackEvent('Sidebar', 'Opened Folder');
    performance.mark(this.perfStartMarkName);
  }

  public static complete(): void {
    this.recordPerf('Success');
  }

  public static fail(reason: any): void {
    Logger.error(`Something went wrong after opening the folder ${this.openedFolderPath} : `, reason);
    this.recordPerf('Fail');
  }

  private static clearPerf(): void {
    performance.clearMarks();
    performance.clearMeasures();
  }

  private static recordPerf(resultStr: string): void {
    performance.mark(this.perfEndMarkName);
    performance.measure(this.perfMeasureName, this.perfStartMarkName, this.perfEndMarkName);
    const perfEntries = performance.getEntriesByName(this.perfMeasureName);
    const duration = moment.duration(perfEntries[0].duration).format('HH:mm:ss.SSS', { trim: false });
    Logger.info(`Open Folder Result: ${resultStr}, Performance: ${duration}`, perfEntries);
    Analytics.trackEvent('Opened Folder Info', `Opened Folder: Performance`, `Performance (${resultStr}): ${duration}`);
  }
}
