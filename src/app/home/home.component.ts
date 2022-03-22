import { Component, ChangeDetectionStrategy, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import Split from 'split.js';
import { LeafletMapForceRenderService } from '../map/leaflet-map/leaflet-map-force-render/leaflet-map-force-render.service';
import { FolderSelectionService } from '../shared/service/folder-selection.service';
import { LoadedFilesStatusBarService } from '../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { ThumbnailGenerationService } from '../thumbnail-generation/service/thumbnail-generation.service';
import { ThumbnailGenerationStatusBarService } from '../thumbnail-generation/status-bar/service/thumbnail-generation-status-bar.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit, OnInit {
  public thumbnailGenerationStatusBarVisible = false;
  public loadedFilesStatusBarVisible: boolean;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private folderSelectionService: FolderSelectionService,
              private thumbnailGenerationService: ThumbnailGenerationService,
              private thumbnailGenerationStatusBarService: ThumbnailGenerationStatusBarService,
              public loadedFilesStatusBarService: LoadedFilesStatusBarService,
              private leafletMapForceRenderService: LeafletMapForceRenderService) {}

  ngOnInit() {
    this.folderSelectionService.folderSelected.subscribe(
      () => this.thumbnailGenerationStatusBarVisible = false);
    this.thumbnailGenerationService.generationStarted.subscribe(
      () => this.thumbnailGenerationStatusBarVisible = true);
    this.thumbnailGenerationStatusBarService.closeRequested.subscribe(
      () => this.thumbnailGenerationStatusBarVisible = false);

    this.loadedFilesStatusBarService.visible.subscribe(visible => {
      this.loadedFilesStatusBarVisible = visible;
      this.changeDetectorRef.detectChanges();
    });
    this.loadedFilesStatusBarService.setInitialVisibility(); // Initial visibility needs to be set after subscription.
  }

  ngAfterViewInit() {
    Split(['#left-sidebar', '#right-map'], {
      sizes: [25, 75],
      minSize: 200,
      gutterSize: 8, // 8px, which is the same width as the splitter gutter in Photo Data Viewer.
      snapOffset: 0,
    });

    // Leaflet needs to be rendered again after Split.js starts working. Otherwise, the map is not rendered correctly.
    this.leafletMapForceRenderService.forceRenderMapWithoutPhoto();
  }
}
