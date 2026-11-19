import { Service } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Logger } from '../../src-shared/log/logger';

import { DropToOpenService } from './drop-to-open/drop-to-open.service';
import { LanguageDialogAtAppLaunchService } from './language/language-dialog-at-app-launch.service';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';

import { AppComponent } from './app.component';

// The dialogs that the two services were asked to show, in order.
let dialogsShown: string[];
// Closes the Language dialog of the test.
let closeLanguageDialog: () => void;
// Has the Language dialog of the test fail, as when it cannot be opened.
let failLanguageDialog: (reason: Error) => void;

@Service({ autoProvided: false })
class DummyLanguageDialogAtAppLaunchService {
  /** As the real one, resolves when the Language dialog is closed: here, when the test closes it. */
  public showLanguageDialogIfUserHasNotClickedOk(): Promise<void> {
    dialogsShown.push('language dialog');
    return new Promise((resolve, reject) => {
      closeLanguageDialog = resolve;
      failLanguageDialog = reject;
    });
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

  it('gives the drag events of the whole window to DropToOpenService', () => {
    const service = TestBed.inject(DropToOpenService);
    const dragStart = vi.spyOn(service, 'dragStart').mockImplementation(() => undefined);
    const dragEnd = vi.spyOn(service, 'dragEnd').mockImplementation(() => undefined);
    const dragEnter = vi.spyOn(service, 'dragEnter').mockImplementation(() => undefined);
    const dragOver = vi.spyOn(service, 'dragOver').mockImplementation(() => undefined);
    const dragLeave = vi.spyOn(service, 'dragLeave').mockImplementation(() => undefined);
    const drop = vi.spyOn(service, 'drop').mockResolvedValue(undefined);
    const [start, end, enter, over, leave, dropped] = ['dragstart', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop']
      .map(type => new Event(type));
    [start, end, enter, over, leave, dropped].forEach(event => window.dispatchEvent(event));
    expect(dragStart.mock.calls).toEqual([[]]);
    expect(dragEnd.mock.calls).toEqual([[]]);
    expect(dragEnter.mock.calls).toEqual([[enter]]);
    expect(dragOver.mock.calls).toEqual([[over]]);
    expect(dragLeave.mock.calls).toEqual([[leave]]);
    expect(drop.mock.calls).toEqual([[dropped]]);
  });

  it('shows the hint over the window while files are dragged over it', async () => {
    const service = TestBed.inject(DropToOpenService);
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('app-drop-hint')).toBeNull();
    // The files of a drag from Explorer or Finder, over the page.
    const drag = { target: host, dataTransfer: { types: ['Files'], dropEffect: 'none' }, preventDefault: () => undefined };
    service.dragEnter(drag as unknown as DragEvent);
    await fixture.whenStable();
    expect(host.querySelector('app-drop-hint')?.textContent.trim()).toBe('Drop to open the folder.');

    service.dragLeave(drag as unknown as DragEvent);
    await fixture.whenStable();
    expect(host.querySelector('app-drop-hint')).toBeNull();
  });

  it('shows the Welcome dialog only once the Language dialog is closed', async () => {
    await fixture.whenStable();
    expect(dialogsShown).toEqual(['language dialog']);

    closeLanguageDialog();
    await vi.waitFor(() => expect(dialogsShown).toEqual(['language dialog', 'welcome dialog']));
  });

  it('shows the Welcome dialog also when the Language dialog fails, and logs the failure', async () => {
    const logError = vi.spyOn(Logger, 'error').mockImplementation(() => undefined);
    await fixture.whenStable();

    const failure = new Error('The Language dialog could not be opened.');
    failLanguageDialog(failure);

    await vi.waitFor(() => expect(dialogsShown).toEqual(['language dialog', 'welcome dialog']));
    expect(logError).toHaveBeenCalledWith('Failed to show the Language dialog. The Welcome dialog is shown next.', failure);
    logError.mockRestore();
  });
});
