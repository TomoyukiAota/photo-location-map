import { Registry } from 'rage-edit';

const photoLocationMapPath = String.raw`C:\Users\Tomoyuki\AppData\Local\Programs\Photo Location Map\Photo Location Map.exe`;

export async function addRegistryForExplorerContextMenu() {
  // Add context menu item for files
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', '', 'Open with &Photo Location Map');
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', 'icon', photoLocationMapPath);
  await Registry.set('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap\\command', '', `${photoLocationMapPath} "%1"`);

  // Add context menu item for directories
  // TODO

  // Add context menu item for background
  // TODO

  // TODO: Add logging and analytics
}
