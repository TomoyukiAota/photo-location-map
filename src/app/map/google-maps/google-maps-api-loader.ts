import { Logger } from '../../../../src-shared/log/logger';

export class GoogleMapsApiLoader {
  public static waitUntilLoaded(): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const id = setInterval(() => {
        if (typeof google !== 'undefined') {
          clearInterval(id);
          const endTime = performance.now();
          const duration = endTime - startTime;
          Logger.info(`It took ${duration} ms to load Google Maps API.`);
          resolve();
        }
      }, 1);
    });
  }
}
