import * as moment from 'moment';
import 'moment-duration-format'; // To use moment.duration().format()
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';

export class FolderSelectionRecorder {
  private static readonly perfMeasureName = 'FolderSelection';
  private static readonly perfStartMarkName = 'FolderSelection:start';
  private static readonly perfEndMarkName = 'FolderSelection:end';

  private static selectedFolderPath: string;

  public static start(selectedFolderPath: string): void {
    this.clearPerf();
    this.selectedFolderPath = selectedFolderPath;
    Logger.info(`Selected Folder: ${selectedFolderPath}`);
    Analytics.trackEvent('Sidebar', 'Selected Folder');
    performance.mark(this.perfStartMarkName);
  }

  public static complete(): void {
    this.recordPerf('Success');
  }

  public static fail(reason: any): void {
    Logger.error(`Something went wrong after selecting the folder ${this.selectedFolderPath} : `, reason);
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
    Logger.info(`Folder Selection Result: ${resultStr}, Performance: ${duration}`, perfEntries);
    Analytics.trackEvent('Selected Folder Info', `Selected Folder: Performance`, `Performance (${resultStr}): ${duration}`);
  }
}
