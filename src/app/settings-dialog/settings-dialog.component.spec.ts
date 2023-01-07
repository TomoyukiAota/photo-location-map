import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MockComponents, MockProvider } from 'ng-mocks';

import { AppearanceSettingsComponent } from './appearance-settings/appearance-settings.component';
import { CacheSettingsComponent } from './cache-settings/cache-settings.component';
import { DateTimeSettingsComponent } from './date-time-settings/date-time-settings.component';

import { SettingsDialogComponent } from './settings-dialog.component';

describe('SettingsDialogComponent', () => {
  let component: SettingsDialogComponent;
  let fixture: ComponentFixture<SettingsDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SettingsDialogComponent,
        ...MockComponents(
          AppearanceSettingsComponent,
          CacheSettingsComponent,
          DateTimeSettingsComponent,
        )
      ],
      imports: [
        MatDialogModule,
        MatListModule
      ],
      providers: [
        MockProvider(MatDialogRef)
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
