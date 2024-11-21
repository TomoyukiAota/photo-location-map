import { app } from '@electron/remote';
import { Registry } from 'rage-edit';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../src-shared/log/logger';

const photoLocationMapExePath = app.getPath('exe'); // e.g. 'C:\Users\Tomoyuki\AppData\Local\Programs\Photo Location Map\Photo Location Map.exe'

export async function addRegistryForExplorerContextMenu() {
  // Add the Explorer's context menu item for files
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapExePath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapExePath} --open "%1"`);

  // Add the Explorer's context menu item for directories
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapExePath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapExePath} --open "%1"`);

  // Add the Explorer's context menu item for the background
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapExePath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapExePath} --open "%V"`);

  Logger.info('[Registry] Added the registry keys for the Explorer\'s context menu.');
  Analytics.trackEvent('Registry', '[Registry] Add Explorer Context Menu');
}
