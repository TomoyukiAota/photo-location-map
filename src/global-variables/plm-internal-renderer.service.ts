import { Injectable, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Logger } from '../../src-shared/log/logger';
import { AboutBoxComponent } from '../app/about-box/about-box.component';
import { DirectoryTreeViewSelectionService } from '../app/directory-tree-view/directory-tree-view-selection.service';
import { SettingsDialogComponent } from '../app/settings-dialog/settings-dialog.component';
import { OpenAfterLaunchService } from '../app/shared/service/open-after-launch.service';
import { PhotoSelectionHistoryService } from '../app/shared/service/photo-selection-history.service';
import { WelcomeDialogComponent } from '../app/welcome-dialog/welcome-dialog.component';
import {
  PlmInternalRenderer,
  PlmInternalRendererAboutBox,
  PlmInternalRendererPhotoSelection,
  PlmInternalRendererRecordAtAppLaunch,
  PlmInternalRendererSettingsDialog,
  PlmInternalRendererWelcomeDialog
} from './global-variable-for-internal-use-in-renderer';

@Injectable({
  providedIn: 'root'
})
export class PlmInternalRendererService {
  constructor(private dialog: MatDialog,
              private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private ngZone: NgZone,
              private openAfterLaunchService: OpenAfterLaunchService,
              private photoSelectionHistoryService: PhotoSelectionHistoryService) {
  }

  public initialize(): void {
    window.plmInternalRenderer = window.plmInternalRenderer || new PlmInternalRenderer();

    window.plmInternalRenderer.recordAtAppLaunch = window.plmInternalRenderer.recordAtAppLaunch || new PlmInternalRendererRecordAtAppLaunch();
    window.plmInternalRenderer.recordAtAppLaunch.handleRecordAtAppLaunchFinished = () => this.handleRecordAtAppLaunchFinished();

    window.plmInternalRenderer.aboutBox = window.plmInternalRenderer.aboutBox || new PlmInternalRendererAboutBox();
    window.plmInternalRenderer.aboutBox.showAboutBox = () => this.showAboutBox();

    window.plmInternalRenderer.settingsDialog = window.plmInternalRenderer.settingsDialog || new PlmInternalRendererSettingsDialog();
    window.plmInternalRenderer.settingsDialog.showSettingsDialog = () => this.showSettingsDialog();

    window.plmInternalRenderer.welcomeDialog = window.plmInternalRenderer.welcomeDialog || new PlmInternalRendererWelcomeDialog();
    window.plmInternalRenderer.welcomeDialog.showWelcomeDialog = () => this.showWelcomeDialog();

    window.plmInternalRenderer.photoSelection = window.plmInternalRenderer.photoSelection || new PlmInternalRendererPhotoSelection();
    window.plmInternalRenderer.photoSelection.undo = () => this.undoPhotoSelection();
    window.plmInternalRenderer.photoSelection.redo = () => this.redoPhotoSelection();
    window.plmInternalRenderer.photoSelection.selectOnlyThis = (photoPath) => this.selectOnlyThis(photoPath);
  }

  public destroy(): void {
    window.plmInternalRenderer.recordAtAppLaunch.handleRecordAtAppLaunchFinished = null;
    window.plmInternalRenderer.aboutBox.showAboutBox = null;
    window.plmInternalRenderer.settingsDialog.showSettingsDialog = null;
    window.plmInternalRenderer.welcomeDialog.showWelcomeDialog = null;
    window.plmInternalRenderer.photoSelection = null;
  }

  private handleRecordAtAppLaunchFinished() {
    this.ngZone.run(() => {
      // noinspection JSIgnoredPromiseFromCall
      this.openAfterLaunchService.openAfterLaunchIfNeeded();
    });
  }

  private showAboutBox(): void {
    this.ngZone.run(() => {
      this.dialog.open(AboutBoxComponent, {
        width: '600px',
        height: '420px',
        panelClass: 'custom-dialog-container',
        autoFocus: false,
        restoreFocus: false
      });
      Logger.info('Displayed About Box.');
    });
  }

  private showSettingsDialog() {
    this.ngZone.run(() => {
      this.dialog.open(SettingsDialogComponent, {
        width: '1000px',
        height: '600px',
        panelClass: 'custom-dialog-container',
        autoFocus: false,
        restoreFocus: false,
        disableClose: true
      });
      Logger.info('Displayed Settings Dialog.');
    });
  }

  private showWelcomeDialog(): void {
    this.ngZone.run(() => {
      this.dialog.open(WelcomeDialogComponent, {
        width: '620px',
        height: '495px',
        panelClass: 'custom-dialog-container',
        autoFocus: false,
        restoreFocus: false,
        disableClose: true
      });
      Logger.info('Displayed Welcome Dialog.');
    });
  }

  private undoPhotoSelection() {
    this.ngZone.run(() => {
      this.photoSelectionHistoryService.undo();
      Logger.debug(`Called PlmInternalRendererService::undoPhotoSelection`);
    });
  }

  private redoPhotoSelection() {
    this.ngZone.run(() => {
      this.photoSelectionHistoryService.redo();
      Logger.debug(`Called PlmInternalRendererService::redoPhotoSelection`);
    });
  }

  private selectOnlyThis(photoPath: string) {
    this.ngZone.run(() => {
      this.directoryTreeViewSelectionService.select([photoPath]);
      Logger.debug(`Called PlmInternalRendererService::selectOnlyThis for ${photoPath}`);
    });
  }
}
