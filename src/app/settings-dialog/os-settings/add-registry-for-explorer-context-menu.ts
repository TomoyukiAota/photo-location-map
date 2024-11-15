import { app } from '@electron/remote';
import { Registry } from 'rage-edit';

const photoLocationMapExePath = app.getPath('exe'); // e.g. 'C:\Users\Tomoyuki\AppData\Local\Programs\Photo Location Map\Photo Location Map.exe'

export async function addRegistryForExplorerContextMenu() {
  // Add the Explorer's context menu item for files
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapExePath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapExePath} "%1"`);

  // Add the Explorer's context menu item for directories
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapExePath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapExePath} "%1"`);

  // Add the Explorer's context menu item for the background
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapExePath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapExePath} "%V"`);

  // TODO: Add logging and analytics
}
