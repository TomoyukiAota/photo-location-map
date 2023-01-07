import { Injectable } from '@angular/core';
import { TestBed, waitForAsync, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { TranslateModule } from '@ngx-translate/core';

import { WelcomeDialogAtAppLaunchService } from './welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';

import { AppComponent } from './app.component';

@Injectable()
class DummyWelcomeDialogAtAppLaunchService {
  public showWelcomeDialogIfUserHasNotClickedOk() { /* Empty */ }
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      providers: [
        {
          provide: WelcomeDialogAtAppLaunchService,
          useClass: DummyWelcomeDialogAtAppLaunchService
        }
      ],
      imports: [
        MatDialogModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
