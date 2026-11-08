import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OsSettingsComponent } from './os-settings.component';

describe('OsSettingsComponent', () => {
  let fixture: ComponentFixture<OsSettingsComponent>;
  let answerFromMainProcess: () => void;
  let failInMainProcess: (error: Error) => void;

  beforeEach(async () => {
    // The main process answers only when the test says so, after the click has been rendered, as the registry answers
    // later than that. The message then comes after an await, which must still be shown.
    const mainProcessAnswer = new Promise<void>((resolve, reject) => {
      answerFromMainProcess = resolve;
      failInMainProcess = reject;
    });
    vi.spyOn(window.plm.explorerContextMenu, 'add').mockReturnValue(mainProcessAnswer);
    vi.spyOn(window.plm.explorerContextMenu, 'remove').mockReturnValue(mainProcessAnswer);
    await TestBed.configureTestingModule({ imports: [OsSettingsComponent] }).compileComponents();
    fixture = TestBed.createComponent(OsSettingsComponent);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** The lines that the tab shows below its buttons. */
  function messageLines(): string[] {
    const lines = fixture.nativeElement.querySelectorAll('.message-after-button-clicked div') as NodeListOf<HTMLElement>;
    return Array.from(lines, line => line.textContent.trim());
  }

  /** Clicks the button, which asks the main process; nothing is said until the main process answers. */
  async function click(buttonText: 'Add' | 'Remove'): Promise<void> {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    buttons.find(button => button.textContent.trim() === buttonText).click();
    await fixture.whenStable();
    const asked = buttonText === 'Add' ? window.plm.explorerContextMenu.add : window.plm.explorerContextMenu.remove;
    const notAsked = buttonText === 'Add' ? window.plm.explorerContextMenu.remove : window.plm.explorerContextMenu.add;
    expect(asked).toHaveBeenCalledExactlyOnceWith();
    expect(notAsked).not.toHaveBeenCalled();
    expect(messageLines()).toEqual([]);
  }

  it('says what Add did once the main process has changed the registry', async () => {
    await click('Add');
    answerFromMainProcess();

    await vi.waitFor(() => expect(messageLines()).toEqual([
      'Added "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ]));
  });

  it('says what Remove did once the main process has changed the registry', async () => {
    await click('Remove');
    answerFromMainProcess();

    await vi.waitFor(() => expect(messageLines()).toEqual([
      'Removed "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ]));
  });

  it('says that Add failed when the main process could not change the registry', async () => {
    await click('Add');
    failInMainProcess(new Error('reg.exe add failed'));

    await vi.waitFor(() => expect(messageLines()).toEqual([
      'Failed to add "Open with Photo Location Map" in the context menu of Explorer.',
    ]));
  });

  it('says that Remove failed when the main process could not change the registry', async () => {
    await click('Remove');
    failInMainProcess(new Error('reg.exe delete failed'));

    await vi.waitFor(() => expect(messageLines()).toEqual([
      'Failed to remove "Open with Photo Location Map" from the context menu of Explorer.',
    ]));
  });
});
