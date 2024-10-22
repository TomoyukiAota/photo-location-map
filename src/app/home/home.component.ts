import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import Split from 'split.js';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { LeafletMapForceRenderService } from '../map/leaflet-map/leaflet-map-force-render/leaflet-map-force-render.service';
import { OpenFolderService } from '../shared/service/open-folder.service';
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
  private sidebarSplitInstance: Split.Instance;
  private currentSidebarUpperPaneHeightPx: number;

  @ViewChild('sidebar') private sidebarDiv: ElementRef;
  @ViewChild('sidebarUpperPane') private sidebarUpperPaneDiv: ElementRef;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private openFolderService: OpenFolderService,
              private thumbnailGenerationService: ThumbnailGenerationService,
              private thumbnailGenerationStatusBarService: ThumbnailGenerationStatusBarService,
              public loadedFilesStatusBarService: LoadedFilesStatusBarService,
              private leafletMapForceRenderService: LeafletMapForceRenderService) {}

  ngOnInit() {
    this.openFolderService.isFolderOpened$.subscribe(
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
    const gutterSize = 8;              // 8px, which is the same width as the splitter gutter in Photo Data Viewer.
    const gutterSizeWithinSidebar = 4; // Smaller compared to the other gutters, but this is for esthetic of GUI.

    Split(['#home-left-sidebar', '#home-right'], {
      sizes: [25, 75],
      minSize: 200,
      gutterSize: gutterSize,
      snapOffset: 0,
    });

    this.configureSplitWithinSidebar(gutterSizeWithinSidebar);

    Split(['#home-map', '#home-chart'], {
      direction: 'vertical',
      sizes: [70, 30],
      minSize: 0,
      gutterSize: gutterSize,
      snapOffset: 0,
    });

    // Leaflet needs to be rendered again after Split.js starts working. Otherwise, the map is not rendered correctly.
    this.leafletMapForceRenderService.forceRenderMapWithoutPhoto();
  }

  private configureSplitWithinSidebar(gutterSize: number) {
    const upperPaneMaxHeightPx = 66;
    const panesHeight = this.calculateSidebarPanesHeightPercent(upperPaneMaxHeightPx, gutterSize);
    this.sidebarSplitInstance = Split(['#home-sidebar-upper-pane', '#home-sidebar-lower-pane'], {
      direction: 'vertical',
      sizes: panesHeight,
      minSize: [0, 0],
      maxSize: [upperPaneMaxHeightPx, Infinity],
      gutterSize: gutterSize,
      snapOffset: 0,
      onDragEnd: () => {
        this.currentSidebarUpperPaneHeightPx = this.getHeightPx(this.sidebarUpperPaneDiv);
        Logger.info(`Changed sidebar upper pane height to ${this.currentSidebarUpperPaneHeightPx}px`);
        Analytics.trackEvent('Sidebar', 'Changed Sidebar Upper Pane Height', `${this.currentSidebarUpperPaneHeightPx}px`);
      }
    });
    this.currentSidebarUpperPaneHeightPx = upperPaneMaxHeightPx;
    this.handleWindowResize(gutterSize);
  }

  private calculateSidebarPanesHeightPercent(desiredUpperPaneHeightPx: number, gutterSize: number) {
    const sidebarHeightPx = this.getHeightPx(this.sidebarDiv);

    // Taking the gutter into account so that the actual height rendered on the browser becomes the same as the desired height.
    const upperPaneHeightPxForSplitJs = desiredUpperPaneHeightPx + (gutterSize / 2);

    const upperPaneHeightPercent = (upperPaneHeightPxForSplitJs / sidebarHeightPx) * 100;
    const lowerPaneHeightPercent = 100 - upperPaneHeightPercent;

    return [upperPaneHeightPercent, lowerPaneHeightPercent];
  }

  private getHeightPx(elementRef: ElementRef) {
    const sidebarUpperPaneRect: DOMRect = elementRef.nativeElement.getBoundingClientRect();
    return sidebarUpperPaneRect.height;
  }

  private handleWindowResize(gutterSize: number) {
    window.onresize = () => {
      const panesHeight = this.calculateSidebarPanesHeightPercent(this.currentSidebarUpperPaneHeightPx, gutterSize);
      this.sidebarSplitInstance.setSizes(panesHeight);
    };
  }
}
