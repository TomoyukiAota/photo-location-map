import 'reflect-metadata';

import { ScrollingModule } from '@angular/cdk/scrolling';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';

import { provideTranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxEchartsModule } from 'ngx-echarts';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SidebarUpperPaneComponent } from './sidebar/upper-pane/sidebar-upper-pane.component';
import { SidebarUpperPaneMoreOptionsComponent } from './sidebar/upper-pane/more-options/sidebar-upper-pane-more-options.component';
import { SidebarLowerPaneComponent } from './sidebar/lower-pane/sidebar-lower-pane.component';
import { DirectoryTreeViewComponent } from './directory-tree-view/directory-tree-view.component';
import { DirTreeViewPhotoInfoComponent } from './directory-tree-view/dir-tree-view-photo-info/dir-tree-view-photo-info.component';
import { DirTreeViewSortShootingTimeInfoComponent } from './directory-tree-view/dir-tree-view-sort/shooting-time-info/dir-tree-view-sort-shooting-time-info.component';
import { LoadingFolderDialogComponent } from './loading-folder/dialog/loading-folder-dialog.component';
import { MapComponent } from './map/map/map.component';
import { GoogleMapsComponent } from './map/google-maps/google-maps.component';
import { LeafletMapComponent } from './map/leaflet-map/leaflet-map.component';
import { DateTimeTakenChartComponent } from './date-time-taken-chart/date-time-taken-chart.component';
import { DateTimeTakenChartConfigComponent } from './date-time-taken-chart/config/date-time-taken-chart-config.component';
import { SelectPhotosWithinZoomComponent } from './date-time-taken-chart/select-photos-within-zoom/select-photos-within-zoom.component';
import { AboutBoxComponent } from './about-box/about-box.component';
import { WelcomeDialogComponent } from './welcome-dialog/welcome-dialog.component';
import { SettingsDialogComponent } from './settings-dialog/settings-dialog.component';
import { ThumbnailGenerationStatusBarComponent } from './thumbnail-generation/status-bar/component/thumbnail-generation-status-bar.component';
import { ThumbnailGenerationErrorDialogComponent } from './thumbnail-generation/error-dialog/thumbnail-generation-error-dialog.component';
import { ThumbnailGenerationErrorTableComponent } from './thumbnail-generation/error-dialog/table/thumbnail-generation-error-table.component';
import { AppearanceSettingsComponent } from './settings-dialog/appearance-settings/appearance-settings.component';
import { DateTimeSettingsComponent } from './settings-dialog/date-time-settings/date-time-settings.component';
import { OsSettingsComponent } from './settings-dialog/os-settings/os-settings.component';
import { CacheSettingsComponent } from './settings-dialog/cache-settings/cache-settings.component';
import { NoPhotosWithLocationDataDialogComponent } from './no-photos-with-location-data-dialog/no-photos-with-location-data-dialog.component';
import { LoadedFilesStatusBarComponent } from './loaded-files-status-bar/component/loaded-files-status-bar.component';
import { AnalyticsErrorHandler } from './shared/error/analytics-error-handler';

@NgModule({
  declarations: [
    AppComponent,
    AboutBoxComponent,
    SettingsDialogComponent,
    WelcomeDialogComponent,
    HomeComponent,
    SidebarUpperPaneComponent,
    SidebarUpperPaneMoreOptionsComponent,
    SidebarLowerPaneComponent,
    DirectoryTreeViewComponent,
    DirTreeViewPhotoInfoComponent,
    DirTreeViewSortShootingTimeInfoComponent,
    LoadingFolderDialogComponent,
    MapComponent,
    GoogleMapsComponent,
    LeafletMapComponent,
    DateTimeTakenChartComponent,
    DateTimeTakenChartConfigComponent,
    SelectPhotosWithinZoomComponent,
    ThumbnailGenerationStatusBarComponent,
    ThumbnailGenerationErrorDialogComponent,
    ThumbnailGenerationErrorTableComponent,
    AppearanceSettingsComponent,
    DateTimeSettingsComponent,
    OsSettingsComponent,
    CacheSettingsComponent,
    NoPhotosWithLocationDataDialogComponent,
    LoadedFilesStatusBarComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    TranslatePipe,
    TranslateDirective,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTreeModule,
    NgxEchartsModule.forRoot({
      echarts: async () => {
        // ECharts and its official v5 theme share the same core in the ESM bundle,
        // so the theme registers on the instance passed to ngx-echarts.
        const echarts = await import('echarts');
        await import('echarts/theme/v5.js');
        if (typeof process !== 'undefined' && process.env.PLM_E2E === '1') {
          // Read the real chart through the same namespace that ngx-echarts receives.
          (window as Window & { __plmReadChartTheme?: (element: HTMLElement) => unknown }).__plmReadChartTheme = element => ({
            palette: echarts.getInstanceByDom(element)?.getOption().color,
            api: {
              init: typeof echarts.init,
              getInstanceByDom: typeof echarts.getInstanceByDom,
              registerTheme: typeof echarts.registerTheme,
            },
          });
        }
        return echarts;
      },
    }),
    ScrollingModule,
    TableVirtualScrollModule,
  ],
  providers: [
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
        failOnError: true, // Preserve the original loader's HTTP error propagation.
      }),
    }),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    { provide: ErrorHandler, useClass: AnalyticsErrorHandler },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
