import type { OpenDialogReturnValue } from 'electron';
import { isAbsolutePath } from '../../../../src-shared/path/is-absolute-path.js';
import { currentPlatform } from '../../../../src-shared/startup/startup-metadata.js';

export interface OpenFolderDialogHistoryDependencies {
  read(): unknown;
  write(directoryPath: string): void | Promise<void>;
  isDirectory(directoryPath: string): Promise<boolean>;
  reportFailure(error: unknown): void;
}

// Electron 43 stopped restoring the native dialog's directory automatically.
// This remembers confirmed folder selections; native navigation history is not exposed.
export class OpenFolderDialogHistory {
  private lastConfirmedDirectory: string | undefined;
  private readonly pendingDirectoryChecks = new Map<string, Promise<boolean>>();

  constructor(private readonly dependencies: OpenFolderDialogHistoryDependencies,
              private readonly directoryCheckTimeoutMs = 1000) {
  }

  /** The folder for the picker to start in: the last one chosen while it is still a folder, else undefined. */
  public async getDefaultPath(): Promise<string | undefined> {
    try {
      const directoryPath = this.lastConfirmedDirectory ?? this.dependencies.read();
      if (typeof directoryPath !== 'string' || !isAbsolutePath(directoryPath, currentPlatform()))
        return undefined;

      return await this.checkDirectory(directoryPath) ? directoryPath : undefined;
    } catch (error) {
      this.dependencies.reportFailure(error);
      return undefined;
    }
  }

  private checkDirectory(directoryPath: string): Promise<boolean> {
    const pendingCheck = this.pendingDirectoryChecks.get(directoryPath);
    if (pendingCheck) return pendingCheck;

    const check = Promise.resolve().then(() => this.dependencies.isDirectory(directoryPath));
    let timer: ReturnType<typeof setTimeout>;
    const boundedCheck = new Promise<boolean>((resolve, reject) => {
      timer = setTimeout(() => resolve(false), this.directoryCheckTimeoutMs);
      // The rejection handler also consumes errors arriving after the timeout.
      void check.then(resolve, reject);
    });
    this.pendingDirectoryChecks.set(directoryPath, boundedCheck);

    const removePendingCheck = () => {
      clearTimeout(timer);
      if (this.pendingDirectoryChecks.get(directoryPath) === boundedCheck)
        this.pendingDirectoryChecks.delete(directoryPath);
    };
    // fs.stat cannot cancel a stalled network lookup. Keep its entry even after
    // the bounded result times out, so later picker calls cannot start more I/O.
    void check.then(removePendingCheck, removePendingCheck);
    return boundedCheck;
  }

  /** The folder chosen, remembered for the next picker, or undefined if cancelled; a failed save is only reported. */
  public rememberSelection(result: Pick<OpenDialogReturnValue, 'canceled' | 'filePaths'>): string | undefined {
    if (result.canceled || result.filePaths.length === 0)
      return undefined;

    const selectedFolderPath = result.filePaths[0];
    this.lastConfirmedDirectory = selectedFolderPath;
    // A read-only settings directory must not prevent opening the chosen folder, whether writing fails at once or later.
    try {
      void Promise.resolve(this.dependencies.write(selectedFolderPath)).catch(error => this.dependencies.reportFailure(error));
    } catch (error) {
      this.dependencies.reportFailure(error);
    }
    return selectedFolderPath;
  }
}
