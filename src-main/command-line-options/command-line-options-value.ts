import { CommandLineOptions } from '../../src-shared/command-line-options/command-line-options.js';

class CommandLineOptionsValue {
  private _value: CommandLineOptions;
  public get(): CommandLineOptions { return this._value; }
  public set(value: CommandLineOptions): void { this._value = value; }
}

export const commandLineOptionsValue = new CommandLineOptionsValue();
