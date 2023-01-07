import 'reflect-metadata';
import '../polyfills';

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DirectoryTreeViewComponent } from './directory-tree-view/directory-tree-view.component';
import { DirTreeViewTooltipComponent } from './directory-tree-view/dir-tree-view-tooltip/dir-tree-view-tooltip.component';
import { LoadingFolderDialogComponent } from './loading-folder/dialog/loading-folder-dialog.component';
import { MapComponent } from './map/map/map.component';
import { GoogleMapsComponent } from './map/google-maps/google-maps.component';
import { LeafletMapComponent } from './map/leaflet-map/leaflet-map.component';
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
    DirTreeViewTooltipComponent,
    LoadingFolderDialogComponent,
    MapComponent,
    GoogleMapsComponent,
    LeafletMapComponent,
    ThumbnailGenerationStatusBarComponent,
    DateTimeSettingsComponent,
    CacheSettingsComponent,
    NoPhotosWithLocationDataDialogComponent,
    LoadedFilesStatusBarComponent,
    AppearanceSettingsComponent
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
        MatTreeModule
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
