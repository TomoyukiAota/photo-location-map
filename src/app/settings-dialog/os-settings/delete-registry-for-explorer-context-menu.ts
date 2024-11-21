import { Registry } from 'rage-edit';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../src-shared/log/logger';

export async function deleteRegistryForExplorerContextMenu() {
  // Remove the Explorer's context menu item for files
  await Registry.delete('HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap');

  // Remove the Explorer's context menu item for directories
  await Registry.delete('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap');

  // Remove the Explorer's context menu item for the background
  await Registry.delete('HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap');

  Logger.info('[Registry] Deleted the registry keys for the Explorer\'s context menu.');
  Analytics.trackEvent('Registry', '[Registry] Remove Explorer Context Menu');
}
