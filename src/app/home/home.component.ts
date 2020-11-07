import { Component, ChangeDetectionStrategy, AfterViewInit, OnInit } from '@angular/core';
import Split from 'split.js';
import { OsmForceRenderService } from '../map/osm/osm-force-render/osm-force-render.service';
import { FolderSelectionService } from '../shared/service/folder-selection.service';
import { ThumbnailGenerationService } from '../thumbnail-generation/service/thumbnail-generation.service';
import { ThumbnailGenerationStatusBarService } from '../thumbnail-generation/status-bar/service/thumbnail-generation-status-bar.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit, OnInit {
  public thumbnailGenerationStatusVisible = false;

  constructor(private folderSelectionService: FolderSelectionService,
              private thumbnailGenerationService: ThumbnailGenerationService,
              private thumbnailGenerationStatusBarService: ThumbnailGenerationStatusBarService,
              private osmForceRenderService: OsmForceRenderService) {}

  ngOnInit() {
    this.folderSelectionService.folderSelected.subscribe(
      () => this.thumbnailGenerationStatusVisible = false);
    this.thumbnailGenerationService.thumbnailGenerationStarted.subscribe(
      () => this.thumbnailGenerationStatusVisible = true);
    this.thumbnailGenerationStatusBarService.closeRequested.subscribe(
      () => this.thumbnailGenerationStatusVisible = false);
  }

  ngAfterViewInit() {
    Split(['#left-sidebar', '#right-map'], {
      sizes: [25, 75],
      minSize: 200,
      snapOffset: 0,
    });

    // OSM needs to be rendered again after Split.js starts working. Otherwise, OSM is not rendered correctly.
    this.osmForceRenderService.forceRenderOsmWithoutPhoto();
  }
}
