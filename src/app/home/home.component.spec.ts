import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponents } from 'ng-mocks';

import { HomeComponent } from './home.component';
import { LoadedFilesStatusBarComponent } from '../loaded-files-status-bar/component/loaded-files-status-bar.component';
import { MapComponent } from '../map/map/map.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ThumbnailGenerationStatusBarComponent } from '../thumbnail-generation/status-bar/component/thumbnail-generation-status-bar.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        HomeComponent,
        MockComponents(
          LoadedFilesStatusBarComponent,
          MapComponent,
          SidebarComponent,
          ThumbnailGenerationStatusBarComponent
        )
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
