import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { IpcParams } from '../../../../src-shared/ipc/ipc-params';
import { Logger } from '../../../../src-shared/log/logger';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { Photo } from '../model/photo.model';

@Injectable({
  providedIn: 'root'
})
export class PhotoSelectionHistoryService {
  private history: Photo[][] = [];
  private redoableStates: Photo[][] = [];
  private isUndoRedoInProgress = false;

  constructor(private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService) {
  }

  public reset() {
    this.history.length = 0;
    this.redoableStates.length = 0;
    this.updateUndoRedoMenus();
  }

  public add(photos: Photo[]) {
    if (this.isUndoRedoInProgress) {
      this.isUndoRedoInProgress = false;
      return;
    }
    this.history.push(photos);
    this.redoableStates.length = 0;
    this.updateUndoRedoMenus();
  }

  public undo(): void {
    if (!this.isUndoable) return;
    this.isUndoRedoInProgress = true;
    Logger.info('Undoing Photo Selection.');
    const currentPhotos = this.history.pop();
    this.redoableStates.push(currentPhotos);
    const previousPhotos = this.history[this.history.length - 1];
    const photoPaths = this.getPhotoPaths(previousPhotos);
    this.directoryTreeViewSelectionService.select(photoPaths);
    this.updateUndoRedoMenus();
  }

  public redo(): void {
    if (!this.isRedoable) return;
    this.isUndoRedoInProgress = true;
    Logger.info('Redoing Photo Selection.');
    const photos = this.redoableStates.pop();
    this.history.push(photos);
    const photoPaths = this.getPhotoPaths(photos);
    this.directoryTreeViewSelectionService.select(photoPaths);
    this.updateUndoRedoMenus();
  }

  private updateUndoRedoMenus(): void {
    const ipcParams: IpcParams.PhotoSelection.UpdateUndoRedoMenus = {
      isUndoMenuEnabled: this.isUndoable,
      isRedoMenuEnabled: this.isRedoable,
    };
    ipcRenderer.invoke(IpcConstants.PhotoSelection.UpdateUndoRedoMenus, ipcParams);
  }

  private get isUndoable(): boolean {
    return this.history.length >= 2; // Undoable from 2nd state. 1st state cannot be undone since it does not have the previous state.
  }

  private get isRedoable(): boolean {
    return this.redoableStates.length >= 1;
  }

  private getPhotoPaths(photos: Photo[]): string[] {
    return photos.map(photo => photo.path);
  }
}
