import { Component, AfterViewInit, ElementRef, afterNextRender, afterRenderEffect, viewChild, inject } from '@angular/core';
import Split from 'split.js';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { perfMark } from '../../../src-shared/perf/perf-mark';
import { LoadedFilesStatusBarService } from '../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { ThumbnailGenerationStatusBarService } from '../thumbnail-generation/status-bar/service/thumbnail-generation-status-bar.service';
import { SidebarUpperPaneComponent } from '../sidebar/upper-pane/sidebar-upper-pane.component';
import { SidebarLowerPaneComponent } from '../sidebar/lower-pane/sidebar-lower-pane.component';
import { MapFullScreenService } from '../map/leaflet-map/full-screen/map-full-screen.service';
import { LeafletMapComponent } from '../map/leaflet-map/leaflet-map.component';
import { DateTimeTakenChartComponent } from '../date-time-taken-chart/date-time-taken-chart.component';
import { ThumbnailGenerationStatusBarComponent } from '../thumbnail-generation/status-bar/component/thumbnail-generation-status-bar.component';
import { LoadedFilesStatusBarComponent } from '../loaded-files-status-bar/component/loaded-files-status-bar.component';
import { MoreOptionsMenuComponent } from '../photo-info-viewer/more-options-menu/more-options-menu.component';
import { DirTreeViewStickyRowsService } from '../directory-tree-view/dir-tree-view-sticky-rows/dir-tree-view-sticky-rows.service';

@Component({
  selector: 'app-home',
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html',
  imports: [
    SidebarUpperPaneComponent, SidebarLowerPaneComponent, LeafletMapComponent, DateTimeTakenChartComponent,
    ThumbnailGenerationStatusBarComponent, LoadedFilesStatusBarComponent, MoreOptionsMenuComponent,
  ]
})
export class HomeComponent implements AfterViewInit {
  public thumbnailGenerationStatusBarService = inject(ThumbnailGenerationStatusBarService);
  public loadedFilesStatusBarService = inject(LoadedFilesStatusBarService);
  /** The rows kept at the top of the folder tree, which cover the top of the sidebar's lower pane. */
  public stickyRowsService = inject(DirTreeViewStickyRowsService);
  /** The map in full screen, which hides the sidebar and the chart. */
  public mapFullScreenService = inject(MapFullScreenService);

  private sidebarSplitInstance: Split.Instance;
  private currentSidebarUpperPaneHeightPx: number;
  private readonly gutterSizeWithinSidebar = 4; // Smaller compared to the other gutters, but this is for esthetic of GUI.
  private wasMapFullScreen = false;

  private readonly sidebarDiv = viewChild.required<ElementRef>('sidebar');
  private readonly sidebarUpperPaneDiv = viewChild.required<ElementRef>('sidebarUpperPane');

  constructor() {
    // The home view, with its map and toolbars, is on the screen for the first time: the application can be used.
    afterNextRender(() => perfMark('renderer:home-rendered'));
    // The sidebar is shown again once the map has left full screen, in a window whose size has changed meanwhile.
    afterRenderEffect(() => {
      const mapFullScreen = this.mapFullScreenService.on();
      if (this.wasMapFullScreen && !mapFullScreen)
        this.fitSidebarPanes();
      this.wasMapFullScreen = mapFullScreen;
    });
  }

  ngAfterViewInit() {
    const gutterSize = 8;              // 8px, which is the same width as the splitter gutter in Photo Data Viewer.

    Split(['#home-left-sidebar', '#home-right'], {
      sizes: [25, 75],
      minSize: 200,
      gutterSize: gutterSize,
      snapOffset: 0,
    });

    this.configureSplitWithinSidebar(this.gutterSizeWithinSidebar);

    Split(['#home-map', '#home-chart'], {
      direction: 'vertical',
      sizes: [70, 30],
      minSize: 0,
      gutterSize: gutterSize,
      snapOffset: 0,
    });
    // The map takes the size that Split.js gives its pane, as it watches its size (LeafletMapComponent.watchSize()).
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
        this.currentSidebarUpperPaneHeightPx = this.getHeightPx(this.sidebarUpperPaneDiv());
        Logger.info(`Changed sidebar upper pane height to ${this.currentSidebarUpperPaneHeightPx}px`);
        Analytics.trackEvent('Sidebar', 'Changed Sidebar Upper Pane Height', `${this.currentSidebarUpperPaneHeightPx}px`);
      }
    });
    this.currentSidebarUpperPaneHeightPx = upperPaneMaxHeightPx;
    this.handleWindowResize();
  }

  private calculateSidebarPanesHeightPercent(desiredUpperPaneHeightPx: number, gutterSize: number) {
    const sidebarHeightPx = this.getHeightPx(this.sidebarDiv());

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

  private handleWindowResize() {
    window.onresize = () => this.fitSidebarPanes();
  }

  /**
   * Sizes the sidebar's panes for the sidebar's height, keeping the upper pane's height. Not while the map is in full
   * screen, which hides the sidebar, so that it has no height: it is done when the sidebar is shown again.
   */
  private fitSidebarPanes(): void {
    if (this.getHeightPx(this.sidebarDiv()) === 0)
      return;
    const panesHeight = this.calculateSidebarPanesHeightPercent(this.currentSidebarUpperPaneHeightPx, this.gutterSizeWithinSidebar);
    this.sidebarSplitInstance.setSizes(panesHeight);
  }
}
