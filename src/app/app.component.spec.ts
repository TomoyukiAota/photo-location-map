import { Service } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { LanguageDialogAtAppLaunchService } from './language/language-dialog-at-app-launch.service';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';

import { AppComponent } from './app.component';

// The dialogs that the two services were asked to show, in order.
let dialogsShown: string[];
// Closes the Language dialog of the test.
let closeLanguageDialog: () => void;

@Service({ autoProvided: false })
class DummyLanguageDialogAtAppLaunchService {
  /** As the real one, resolves when the Language dialog is closed: here, when the test closes it. */
  public showLanguageDialogIfUserHasNotClickedOk(): Promise<void> {
    dialogsShown.push('language dialog');
    return new Promise(resolve => closeLanguageDialog = resolve);
  }
}

@Service({ autoProvided: false })
class DummyWelcomeDialogAtAppLaunchService {
  public showWelcomeDialogIfUserHasNotClickedOk() { dialogsShown.push('welcome dialog'); }
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    dialogsShown = [];
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: LanguageDialogAtAppLaunchService,
          useClass: DummyLanguageDialogAtAppLaunchService
        },
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

  it('shows the Welcome dialog only once the Language dialog is closed', async () => {
    await fixture.whenStable();
    expect(dialogsShown).toEqual(['language dialog']);

    closeLanguageDialog();
    await vi.waitFor(() => expect(dialogsShown).toEqual(['language dialog', 'welcome dialog']));
  });
});
