import 'reflect-metadata';
import '../polyfills';

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule, MatProgressBar } from '@angular/material/progress-bar';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AngularSplitModule } from 'angular-split';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DirectoryTreeViewComponent } from './directory-tree-view/directory-tree-view.component';
import { DirTreeViewTooltipComponent } from './directory-tree-view/dir-tree-view-tooltip/dir-tree-view-tooltip.component';
import { LoadingFolderDialogComponent } from './loading-folder/dialog/loading-folder-dialog.component';
import { MapComponent } from './map/map/map.component';
import { GoogleMapsComponent } from './map/google-maps/google-maps.component';
import { OsmComponent } from './map/osm/osm.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SidebarComponent,
    DirectoryTreeViewComponent,
    DirTreeViewTooltipComponent,
    LoadingFolderDialogComponent,
    MapComponent,
    GoogleMapsComponent,
    OsmComponent
  ],
  entryComponents: [
    LoadingFolderDialogComponent
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
    AngularSplitModule.forRoot(),
    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTreeModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
