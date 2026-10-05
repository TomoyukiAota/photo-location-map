// How long the app takes to start, in milliseconds from the start of the process.
// Recorded once per launch: on macOS the main window can be created again later (the "activate" event),
// which is not a startup.
export class StartupTime {
  private static appReadyMs: number | undefined;
  private static isTaken = false;

  public static markAppReady(): void {
    if (this.appReadyMs === undefined)
      this.appReadyMs = elapsedMs();
  }

  /** The times to record, when the main window is first ready to show; undefined after the first call. */
  public static takeOnce(): { appReadyMs: number, mainWindowReadyToShowMs: number } | undefined {
    if (this.isTaken || this.appReadyMs === undefined)
      return undefined;

    this.isTaken = true;
    return { appReadyMs: this.appReadyMs, mainWindowReadyToShowMs: elapsedMs() };
  }
}

function elapsedMs(): number {
  return Math.round(process.uptime() * 1000);
}
