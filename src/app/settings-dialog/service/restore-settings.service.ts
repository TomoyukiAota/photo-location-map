import { Injectable } from '@angular/core';
import { LoadedFilesStatusBarService } from '../../loaded-files-status-bar/service/loaded-files-status-bar.service';

@Injectable({
  providedIn: 'root'
})
export class RestoreSettingsService {
  constructor(private loadedFilesStatusBarService: LoadedFilesStatusBarService) {
  }

  public restore() {
    this.restoreShowStatusBar();
  }

  private restoreShowStatusBar() {
    this.loadedFilesStatusBarService.restoreVisibilityToSettingValue();
  }
}
