import { commandLineOptionsValue } from './command-line-options/command-line-options-value.js';

export class LiveReload {
  public static get enabled() { return commandLineOptionsValue.get().liveReload; }
}
