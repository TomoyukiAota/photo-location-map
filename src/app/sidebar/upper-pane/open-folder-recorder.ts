import moment from 'moment';
import 'moment-duration-format'; // To use moment.duration().format()
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { scrubbedError } from '../../../../src-shared/analytics/record-error';
import { Logger } from '../../../../src-shared/log/logger';

export class OpenFolderRecorder {
  private static readonly perfMeasureName = 'OpenFolder';
  private static readonly perfStartMarkName = 'OpenFolder:start';
  private static readonly perfEndMarkName = 'OpenFolder:end';

  private static openedFolderPath: string;

  public static start(openedFolderPath: string): void {
    this.clearPerf();
    this.openedFolderPath = openedFolderPath;
    Logger.info(`Opened Folder: ${openedFolderPath}`);
    Analytics.trackEvent('Opened Folder Info', 'Opened Folder');
    performance.mark(this.perfStartMarkName);
  }

  public static complete(): void {
    this.recordPerf('Success');
  }

  /** Records why a folder failed to open, without paths, then how long it took, as a folder that opened does. */
  public static fail(reason: unknown): void {
    Logger.errorNotRecorded(`Something went wrong after opening the folder ${this.openedFolderPath} : `, reason);
    const { label, value } = scrubbedError(reason);
    Analytics.trackEvent('Opened Folder Info', 'Opened Folder: Failed', label, value);
    this.recordPerf('Fail');
  }

  private static clearPerf(): void {
    // Only its own entries: the performance timeline also holds the plm: marks of src-shared/perf/perf-mark.ts.
    performance.clearMarks(this.perfStartMarkName);
    performance.clearMarks(this.perfEndMarkName);
    performance.clearMeasures(this.perfMeasureName);
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
