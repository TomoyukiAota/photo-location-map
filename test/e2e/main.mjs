// The entry of the launches of the checkout by the e2e suite, the performance harness and the layout tools: the app's
// main process (out/app), with the app's folder and version, which an entry file of its own does not give. Packaged
// launches use their own unchanged main entry and manifest instead.
import path from 'node:path';
import { app } from 'electron';
import manifest from '../../package.json' with { type: 'json' };

app.setAppPath(path.resolve(import.meta.dirname, '../..'));
// An entry file of its own has Electron's package version rather than the app manifest.
app.getVersion = () => manifest.version;
// Imported once the app's folder and version are set: an import at the top would load the app before them.
await import('../../out/app/src-main/electron-main.js');
