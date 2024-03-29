import 'reflect-metadata';

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
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
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxEchartsModule } from 'ngx-echarts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DirectoryTreeViewComponent } from './directory-tree-view/directory-tree-view.component';
import { DirTreeViewPhotoInfoComponent } from './directory-tree-view/dir-tree-view-photo-info/dir-tree-view-photo-info.component';
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
import { DateTimeSettingsComponent } from './settings-dialog/date-time-settings/date-time-settings.component';
import { CacheSettingsComponent } from './settings-dialog/cache-settings/cache-settings.component';
import { NoPhotosWithLocationDataDialogComponent } from './no-photos-with-location-data-dialog/no-photos-with-location-data-dialog.component';
import { LoadedFilesStatusBarComponent } from './loaded-files-status-bar/component/loaded-files-status-bar.component';
import { AppearanceSettingsComponent } from './settings-dialog/appearance-settings/appearance-settings.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    AboutBoxComponent,
    SettingsDialogComponent,
    WelcomeDialogComponent,
    HomeComponent,
    SidebarComponent,
    DirectoryTreeViewComponent,
    DirTreeViewPhotoInfoComponent,
    LoadingFolderDialogComponent,
    MapComponent,
    GoogleMapsComponent,
    LeafletMapComponent,
    DateTimeTakenChartComponent,
    DateTimeTakenChartConfigComponent,
    SelectPhotosWithinZoomComponent,
    ThumbnailGenerationStatusBarComponent,
    DateTimeSettingsComponent,
    CacheSettingsComponent,
    NoPhotosWithLocationDataDialogComponent,
    LoadedFilesStatusBarComponent,
    AppearanceSettingsComponent,
  ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (HttpLoaderFactory),
                deps: [HttpClient]
            }
        }),
        BrowserAnimationsModule,
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
        MatTreeModule,
        NgxEchartsModule.forRoot({
          echarts: () => import('echarts'),
        }),
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
