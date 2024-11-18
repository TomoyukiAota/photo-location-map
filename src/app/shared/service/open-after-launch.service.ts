import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { CommandLineOptions } from '../../../../src-shared/command-line-options/command-line-options';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { OpenPathService } from './open-path.service';

@Injectable({
  providedIn: 'root'
})
export class OpenAfterLaunchService {
  constructor(private openPathService: OpenPathService) { }

  public async openAfterLaunchIfNeeded() {
    const commandLineOptions = await this.getCommandLineOptionsFromMainProcess();
    console.log('commandLineOptions', commandLineOptions);
    const path = commandLineOptions.open;
    if (path) {
      await this.openPathService.open(path);
    }
  }

  private async getCommandLineOptionsFromMainProcess(): Promise<CommandLineOptions> {
    return await ipcRenderer.invoke(IpcConstants.CommandLineOptions.Get);
  }
}
