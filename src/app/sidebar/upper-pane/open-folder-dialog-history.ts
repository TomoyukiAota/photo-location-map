import type { OpenDialogReturnValue } from 'electron';
import * as path from 'path';

export interface OpenFolderDialogHistoryDependencies {
  read(): unknown;
  write(directoryPath: string): void;
  isDirectory(directoryPath: string): Promise<boolean>;
  reportFailure(error: unknown): void;
}

// Electron 43 stopped restoring the native dialog's directory automatically.
// This remembers confirmed folder selections; native navigation history is not exposed.
export class OpenFolderDialogHistory {
  private lastConfirmedDirectory: string | undefined;

  constructor(private readonly dependencies: OpenFolderDialogHistoryDependencies) {
  }

  public async getDefaultPath(): Promise<string | undefined> {
    try {
      const directoryPath = this.lastConfirmedDirectory ?? this.dependencies.read();
      if (typeof directoryPath !== 'string' || !path.isAbsolute(directoryPath))
        return undefined;

      return await this.dependencies.isDirectory(directoryPath) ? directoryPath : undefined;
    } catch (error) {
      this.dependencies.reportFailure(error);
      return undefined;
    }
  }

  public rememberSelection(result: Pick<OpenDialogReturnValue, 'canceled' | 'filePaths'>): string | undefined {
    if (result.canceled || result.filePaths.length === 0)
      return undefined;

    const selectedFolderPath = result.filePaths[0];
    this.lastConfirmedDirectory = selectedFolderPath;
    try {
      this.dependencies.write(selectedFolderPath);
    } catch (error) {
      // A read-only settings directory must not prevent opening the chosen folder.
      this.dependencies.reportFailure(error);
    }
    return selectedFolderPath;
  }
}
