import { inject, Service } from '@angular/core';
import { LoadedFilesStatusBarService } from '../../loaded-files-status-bar/service/loaded-files-status-bar.service';

@Service()
export class RestoreSettingsService {
  private loadedFilesStatusBarService = inject(LoadedFilesStatusBarService);

  public restore() {
    this.restoreShowStatusBar();
  }

  private restoreShowStatusBar() {
    this.loadedFilesStatusBarService.restoreVisibilityToSettingValue();
  }
}
