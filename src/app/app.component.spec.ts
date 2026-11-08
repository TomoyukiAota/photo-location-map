import { Service } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { WelcomeDialogAtAppLaunchService } from './welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';

import { AppComponent } from './app.component';

@Service({ autoProvided: false })
class DummyWelcomeDialogAtAppLaunchService {
  public showWelcomeDialogIfUserHasNotClickedOk() { /* Empty */ }
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideTranslateService(),
        {
          provide: WelcomeDialogAtAppLaunchService,
          useClass: DummyWelcomeDialogAtAppLaunchService
        }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
