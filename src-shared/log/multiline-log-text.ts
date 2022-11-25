export class MultilineLogText {
  private _text = '';
  public get text(): string { return this._text; }

  public indent = '  '; // 2 spaces as the default indent to make the multiline text look better in the log

  public addLine(line = ''): void {
    const newLine = `${this.indent}${line}\n`;
    this._text = this._text + newLine;
  }

  public addLineWithoutIndent(line = ''): void {
    const newLine = `${line}\n`;
    this._text = this._text + newLine;
  }

  public addLines(lines: string[]): void {
    lines.forEach(line => this.addLine(line));
  }
}

export function convertStringArrayToLogText(lines: string[]): string {
  const multilineLogText = new MultilineLogText();
  multilineLogText.addLineWithoutIndent(); // Add a line break at the beginning to make the multiline text look better in the log
  multilineLogText.addLines(lines);
  return multilineLogText.text;
}
