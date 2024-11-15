import { Registry } from 'rage-edit';

const photoLocationMapPath = String.raw`C:\Users\Tomoyuki\AppData\Local\Programs\Photo Location Map\Photo Location Map.exe`;

export async function addRegistryForExplorerContextMenu() {
  // Add the Explorer's context menu item for files
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapPath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapPath} "%1"`);

  // Add the Explorer's context menu item for directories
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapPath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapPath} "%1"`);

  // Add the Explorer's context menu item for the background
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapPath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapPath} "%V"`);

  // TODO: Add logging and analytics
}
