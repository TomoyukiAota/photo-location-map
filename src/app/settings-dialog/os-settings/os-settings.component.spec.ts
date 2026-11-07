import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Registry } from 'rage-edit';
import { OsSettingsComponent } from './os-settings.component';

describe('OsSettingsComponent', () => {
  let fixture: ComponentFixture<OsSettingsComponent>;
  let answerRegistry: () => void;

  beforeEach(async () => {
    // The registry answers only when the test says so, after the click has been rendered, as the real one answers
    // later than that. The message then comes after an await, which must still be shown.
    const registryAnswer = new Promise<void>(resolve => answerRegistry = resolve);
    vi.spyOn(Registry, 'set').mockReturnValue(registryAnswer);
    vi.spyOn(Registry, 'delete').mockReturnValue(registryAnswer);
    await TestBed.configureTestingModule({ declarations: [OsSettingsComponent] }).compileComponents();
    fixture = TestBed.createComponent(OsSettingsComponent);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function messageLines(): string[] {
    const lines = fixture.nativeElement.querySelectorAll('.message-after-button-clicked div') as NodeListOf<HTMLElement>;
    return Array.from(lines, line => line.textContent.trim());
  }

  async function clickAndAnswer(buttonText: string): Promise<void> {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    buttons.find(button => button.textContent.trim() === buttonText).click();
    await fixture.whenStable();
    expect(messageLines()).toEqual([]);
    answerRegistry();
  }

  it('says what Add did once the registry has been changed', async () => {
    await clickAndAnswer('Add');

    await vi.waitFor(() => expect(messageLines()).toEqual([
      'Added "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ]));
    expect(Registry.set).toHaveBeenCalled();
  });

  it('says what Remove did once the registry has been changed', async () => {
    await clickAndAnswer('Remove');

    await vi.waitFor(() => expect(messageLines()).toEqual([
      'Removed "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ]));
    expect(Registry.delete).toHaveBeenCalled();
  });
});
