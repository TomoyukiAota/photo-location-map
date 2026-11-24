import { Component, AfterViewInit, DestroyRef, ElementRef, afterNextRender, viewChild, inject } from '@angular/core';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { perfMark } from '../../../src-shared/perf/perf-mark';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import { LoadedFilesStatusBarService } from '../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { ThumbnailGenerationStatusBarService } from '../thumbnail-generation/status-bar/service/thumbnail-generation-status-bar.service';
import { SidebarUpperPaneComponent } from '../sidebar/upper-pane/sidebar-upper-pane.component';
import { SidebarLowerPaneComponent } from '../sidebar/lower-pane/sidebar-lower-pane.component';
import { LeafletMapComponent } from '../map/leaflet-map/leaflet-map.component';
import { DateTimeTakenChartComponent } from '../date-time-taken-chart/date-time-taken-chart.component';
import { ThumbnailGenerationStatusBarComponent } from '../thumbnail-generation/status-bar/component/thumbnail-generation-status-bar.component';
import { LoadedFilesStatusBarComponent } from '../loaded-files-status-bar/component/loaded-files-status-bar.component';
import { MoreOptionsMenuComponent } from '../photo-info-viewer/more-options-menu/more-options-menu.component';
import { DirTreeViewStickyRowsService } from '../directory-tree-view/dir-tree-view-sticky-rows/dir-tree-view-sticky-rows.service';
import { parseSavedSize } from './pane-sizes/pane-size';
import { PaneSplit } from './pane-sizes/pane-split';

/** The least width of the sidebar and of the map's side beside it. */
const sidebarMinWidth = 200;
/** The least height that the chart leaves the map, unless the user drags the map smaller than that. */
const mapMinHeight = 200;
/** The height of the sidebar's upper pane, which is its largest: the user can only make it smaller. */
const sidebarUpperPaneHeight = 66;

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
  private readonly destroyRef = inject(DestroyRef);

  private sidebarSplit: PaneSplit;
  private sidebarPanesSplit: PaneSplit;
  private mapSplit: PaneSplit;

  private readonly sidebar = viewChild.required<ElementRef<HTMLElement>>('sidebar');
  private readonly sidebarGutter = viewChild.required<ElementRef<HTMLElement>>('sidebarGutter');
  private readonly right = viewChild.required<ElementRef<HTMLElement>>('right');
  private readonly sidebarUpperPane = viewChild.required<ElementRef<HTMLElement>>('sidebarUpperPane');
  private readonly sidebarPanesGutter = viewChild.required<ElementRef<HTMLElement>>('sidebarPanesGutter');
  private readonly sidebarLowerPane = viewChild.required<ElementRef<HTMLElement>>('sidebarLowerPane');
  private readonly map = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly mapGutter = viewChild.required<ElementRef<HTMLElement>>('mapGutter');
  private readonly chart = viewChild.required<ElementRef<HTMLElement>>('chart');

  constructor() {
    // The home view, with its map and toolbars, is on the screen for the first time: the application can be used.
    afterNextRender(() => perfMark('renderer:home-rendered'));
  }

  ngAfterViewInit() {
    const gutterSize = 8;              // 8px, which is the same width as the splitter gutter in Photo Data Viewer.
    const gutterSizeWithinSidebar = 4; // Smaller compared to the other gutters, but this is for esthetic of GUI.

    // The sidebar keeps the width that the user gave it, and the chart its height, as the window changes and at the
    // next launch: the map takes what the window gains or loses. Until then, the panes keep their shares of the window
    // (pane-sizes/pane-split.ts).
    const savedSidebarWidth = parseSavedSize(UserDataStorage.readOrDefault(UserDataStoragePath.HomeLayout.SidebarWidth, ''));
    const savedChartHeight = parseSavedSize(UserDataStorage.readOrDefault(UserDataStoragePath.HomeLayout.ChartHeight, ''));
    Logger.info(`Pane sizes at launch: sidebar width ${savedSidebarWidth ?? 'default'}, chart height ${savedChartHeight ?? 'default'}`);

    this.sidebarSplit = new PaneSplit({
      panes: [this.sidebar().nativeElement, this.right().nativeElement],
      gutter: this.sidebarGutter().nativeElement,
      direction: 'horizontal',
      gutterSize,
      minSize: sidebarMinWidth,
      defaultShares: [25, 75],
      keptPane: 0,
      savedSize: savedSidebarWidth,
      limits: { min: sidebarMinWidth, max: Infinity, otherMin: sidebarMinWidth },
      onDragged: ([width]) => {
        UserDataStorage.write(UserDataStoragePath.HomeLayout.SidebarWidth, width.toString());
        Logger.info(`Changed sidebar width to ${width}px`);
        Analytics.trackEvent('Sidebar', 'Changed Sidebar Width', `${width}px`);
      },
    });

    this.sidebarPanesSplit = new PaneSplit({
      panes: [this.sidebarUpperPane().nativeElement, this.sidebarLowerPane().nativeElement],
      gutter: this.sidebarPanesGutter().nativeElement,
      direction: 'vertical',
      gutterSize: gutterSizeWithinSidebar,
      minSize: [0, 0],
      maxSize: [sidebarUpperPaneHeight, Infinity],
      defaultShares: [0, 100], // Only while the sidebar has no height: the upper pane has a size of its own.
      keptPane: 0,
      defaultSize: sidebarUpperPaneHeight,
      limits: { min: 0, max: sidebarUpperPaneHeight, otherMin: 0 },
      // TL;DR: At a resize of the window only, as before the other splits kept their panes' sizes.
      // Details: Between two resizes of the window, the upper pane is a share of the sidebar, so a status bar that
      // appears, about 29 pixels high, makes it 2 or 3 pixels shorter. Keeping its height at every change of the
      // sidebar's would move the folder tree by that wherever a status bar has come or gone since, which would be a
      // change of its own, to the e2e suite's screenshots too.
      showSizeAt: 'window-resize',
      onDragged: ([height]) => {
        Logger.info(`Changed sidebar upper pane height to ${height}px`);
        Analytics.trackEvent('Sidebar', 'Changed Sidebar Upper Pane Height', `${height}px`);
      },
    });

    this.mapSplit = new PaneSplit({
      panes: [this.map().nativeElement, this.chart().nativeElement],
      gutter: this.mapGutter().nativeElement,
      direction: 'vertical',
      gutterSize,
      minSize: 0,
      defaultShares: [70, 30],
      keptPane: 1,
      savedSize: savedChartHeight,
      // A map that the user dragged down to nothing comes back at the next launch.
      limits: { min: 0, max: Infinity, otherMin: mapMinHeight },
      onDragged: ([, height]) => {
        UserDataStorage.write(UserDataStoragePath.HomeLayout.ChartHeight, height.toString());
        Logger.info(`Changed chart height to ${height}px`);
        Analytics.trackEvent('DTT Chart', '[DTT Chart] Changed Chart Height', `${height}px`);
      },
    });
    // The map takes the size that Split.js gives its pane, as it watches its size (LeafletMapComponent.watchSize()).

    this.destroyRef.onDestroy(() => [this.sidebarSplit, this.sidebarPanesSplit, this.mapSplit].forEach(split => split.destroy()));
  }

  /** A double-click on the gutter beside the sidebar: the sidebar's default width, at the next launch too. */
  public resetSidebarWidth(): void {
    this.sidebarSplit.reset();
    UserDataStorage.write(UserDataStoragePath.HomeLayout.SidebarWidth, '');
    Logger.info('Reset sidebar width to the default');
    Analytics.trackEvent('Sidebar', 'Reset Sidebar Width');
  }

  /** A double-click on the gutter below the sidebar's upper pane: its default height. */
  public resetSidebarUpperPaneHeight(): void {
    this.sidebarPanesSplit.reset();
    Logger.info('Reset sidebar upper pane height to the default');
    Analytics.trackEvent('Sidebar', 'Reset Sidebar Upper Pane Height');
  }

  /** A double-click on the gutter between the map and the chart: the chart's default height, at the next launch too. */
  public resetChartHeight(): void {
    this.mapSplit.reset();
    UserDataStorage.write(UserDataStoragePath.HomeLayout.ChartHeight, '');
    Logger.info('Reset chart height to the default');
    Analytics.trackEvent('DTT Chart', '[DTT Chart] Reset Chart Height');
  }
}
