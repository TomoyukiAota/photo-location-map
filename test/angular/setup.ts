import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeEach } from 'vitest';
import { UserDataStorage } from '../../src-shared/user-data-storage/user-data-storage.js';
import { createBridgeDouble } from './bridge-double.js';
import type { UserDataStorage as UserDataStorageDouble } from './storage-double.js';

/** The JSDOM instance of vitest's jsdom environment, which vitest puts on the global object. */
declare const jsdom: { window: EventTarget };

// TL;DR: EventTarget.prototype.addEventListener and removeEventListener take `window` as the object to listen on, as
// they do in a browser. vanillajs-datepicker, the calendar of the map's date, calls them so.
// Details: vitest's jsdom environment makes `window` Node's global object (`global.window = global`), and puts the
// members of jsdom's window on it, the functions bound to that window. So `window.addEventListener()` works, but
// jsdom's EventTarget.prototype.addEventListener refuses the global object as `this`, as it is not one of jsdom's
// objects: "'addEventListener' called on an object that is not a valid instance of EventTarget". vanillajs-datepicker
// takes the two functions from EventTarget.prototype when it is loaded (its js/lib/event.js), and calls them with the
// window for its 'resize', so a Datepicker could not be made (MapDatePickerComponent). These give such a call to
// jsdom's window instead. Angular runs vitest with `isolate: false`, so this file runs again for each spec file, in
// the same jsdom: the mark keeps the functions from being replaced twice.
const windowGivenToJsdom = Symbol.for('photo-location-map/window-given-to-jsdom');
if (!Object.hasOwn(EventTarget.prototype, windowGivenToJsdom)) {
  Object.defineProperty(EventTarget.prototype, windowGivenToJsdom, { value: true });
  const { addEventListener, removeEventListener } = EventTarget.prototype;
  EventTarget.prototype.addEventListener = function (this: EventTarget, ...args) {
    addEventListener.apply(this === window ? jsdom.window : this, args);
  };
  EventTarget.prototype.removeEventListener = function (this: EventTarget, ...args) {
    removeEventListener.apply(this === window ? jsdom.window : this, args);
  };
}

const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'plm-vitest-'));

// The page's bridge to the main process, before the application's code is imported: modules read the startup
// metadata while they are evaluated. Each test gets a new one, so that a test's spies on it do not last.
window.plm = createBridgeDouble(temporaryRoot);

beforeEach(() => {
  window.plm = createBridgeDouble(temporaryRoot);
  // The application's UserDataStorage is ./storage-double here ("fileReplacements" in angular.json), built as the
  // module of the application's path. Imported as ./storage-double, it would be a second instance, which the
  // application never reads, so reset() would not isolate the tests.
  (UserDataStorage as unknown as typeof UserDataStorageDouble).reset();
});
afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});
