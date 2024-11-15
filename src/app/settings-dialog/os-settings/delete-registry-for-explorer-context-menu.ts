import { Registry } from 'rage-edit';

export async function deleteRegistryForExplorerContextMenu() {
  // Remove the Explorer's context menu item for files
  await Registry.delete('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap');

  // Remove the Explorer's context menu item for directories
  await Registry.delete('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap');

  // Remove the Explorer's context menu item for the background
  await Registry.delete('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap');

  // TODO: Add logging and analytics
}
