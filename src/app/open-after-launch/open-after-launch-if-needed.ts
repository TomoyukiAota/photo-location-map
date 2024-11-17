import { ipcRenderer } from 'electron';
import { CommandLineOptions } from '../../../src-shared/command-line-options/command-line-options';
import { IpcConstants } from '../../../src-shared/ipc/ipc-constants';

export async function openAfterLaunchIfNeeded() {
  const commandLineOptions = await getCommandLineOptionsFromMainProcess();
  console.log('commandLineOptions', commandLineOptions);
}

async function getCommandLineOptionsFromMainProcess(): Promise<CommandLineOptions> {
  return await ipcRenderer.invoke(IpcConstants.CommandLineOptions.Get);
}
