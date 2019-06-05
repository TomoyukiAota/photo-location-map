import { Logger } from '../../../../src-shared/log/logger';

export class GoogleMapsApiLoader {
  // If Google Maps API cannot be loaded in 20 seconds, something should went wrong.
  private static readonly maxDuration = 20000; // 20 seconds

  private static startTime: number;
  private static intervalId: NodeJS.Timeout;

  public static waitUntilLoaded(): Promise<void> {
    this.startTime = performance.now();
    return new Promise((resolve, reject) => {
      this.intervalId = setInterval(() => this.checkIfGoogleMapsApiIsLoaded(resolve, reject), 1);
    });
  }

  private static checkIfGoogleMapsApiIsLoaded(resolve: (value?: void | PromiseLike<void>) => void,
                                              reject: (reason?: any) => void): void {
    const currentTime = performance.now();
    const currentDuration = currentTime - this.startTime;
    const isApiLoaded = typeof google !== 'undefined';
    if (isApiLoaded) {
      clearInterval(this.intervalId);
      Logger.info(`It took ${currentDuration} ms to load Google Maps API.`);
      resolve();
    } else if (currentDuration > this.maxDuration) {
      clearInterval(this.intervalId);
      Logger.error(`Waiting Google Maps API for more than ${this.maxDuration} ms, but it is still not loaded.`);
      reject();
    }
  }
}
