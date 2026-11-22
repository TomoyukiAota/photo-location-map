import { ComponentFixture, TestBed } from '@angular/core/testing';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { SettingsChangedService } from '../service/settings-changed.service';
import { AppearanceSettingsChangedParameter } from './appearance-settings-changed-parameter';
import { AppearanceSettingsComponent } from './appearance-settings.component';

describe('AppearanceSettingsComponent', () => {
  let fixture: ComponentFixture<AppearanceSettingsComponent>;
  let element: HTMLElement;
  let changes: AppearanceSettingsChangedParameter[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppearanceSettingsComponent] }).compileComponents();
    changes = [];
    TestBed.inject(SettingsChangedService).appearanceSettingsChanged.subscribe(change => changes.push(change));
    fixture = TestBed.createComponent(AppearanceSettingsComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows the rows kept at the top of the folder tree as they are set, with their texts', () => {
    expect(element.querySelector('.sticky-folders-title').textContent).toBe('Sticky Folders');
    expect(element.querySelector('.sticky-folders-description').textContent)
      .toBe('Settings for showing the parent folders while the folder tree is scrolled.');
    expect(element.querySelector('.sticky-folders-maximum mat-label').textContent).toBe('Maximum Rows');
    expect(element.querySelector('.sticky-folders-maximum .mat-mdc-select-value').textContent.trim())
      .toBe(String(currentUserSettings.stickyFolderRowsMaximum));
    const choices = Array.from(element.querySelectorAll('.sticky-folders-left-out-choice'));
    expect(choices.map(choice => choice.textContent.trim()))
      .toEqual(['The folders in the middle', 'The folders near the opened folder', 'The folders near the photos']);
    expect(element.querySelector('.sticky-folders-left-out-choice input:checked').closest('mat-radio-button').textContent.trim())
      .toBe('The folders in the middle');
    // The field's box is as wide as the widest of its choices and its label (settings-styles).
    expect(element.querySelector('.dropdown-box').getAttribute('data-choices')).toBe('3\n4\n5\n6\n7\n8\n9\n10');
  });

  it('heads the choices of the folders left out with what is always kept, which names and describes them', () => {
    const choices = element.querySelector('.sticky-folders-left-out-choices');
    const heading = element.querySelector(`#${choices.getAttribute('aria-labelledby')}`);
    const description = element.querySelector(`#${choices.getAttribute('aria-describedby')}`);
    expect(heading.textContent.trim()).toBe('Where to leave out folders when they do not fit in the maximum rows');
    expect(description.textContent.trim()).toBe('The opened folder and the folder of the rows shown are always kept.');
    expect(heading.parentElement).toBe(description.parentElement);
  });

  it('tells the dialog every setting of the tab when one of them changes', async () => {
    element.querySelectorAll<HTMLInputElement>('.sticky-folders-left-out-choice input')[2].click();
    await fixture.whenStable();
    expect(changes.at(-1)).toEqual({
      showStatusBar: currentUserSettings.showStatusBar,
      stickyFolderRowsMaximum: currentUserSettings.stickyFolderRowsMaximum,
      stickyFolderRowsLeftOut: 'nearPhotos',
    });
  });
});
