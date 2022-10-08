import { session } from 'electron';
import { Logger } from '../src-shared/log/logger';

export function handleAppQuit() {
  Logger.info('Quitting application.');

  // Clear the session's HTTP cache when the app quits so that the cache folder size stays small.
  // An example of the cache is the map because the cache files are created after zooming in/out the map.
  // Cache folder location on Windows: C:\Users\%USERNAME%\AppData\Roaming\Photo Location Map\Cache
  // ------------------------------------------------------
  // Before clearing it for the first time on October 2022,
  // the cache folder size was 434 MB, and the oldest file in the cache folder exists from March 2022.
  // It seems like some portion of the cache is no longer used but still exists.
  session.defaultSession.clearCache();
}
