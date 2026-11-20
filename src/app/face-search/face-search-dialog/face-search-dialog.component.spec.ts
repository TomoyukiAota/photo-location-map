import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FaceSearchDialogComponent, FaceSearchDialogState } from './face-search-dialog.component';
import type { Mock } from 'vitest';

describe('FaceSearchDialogComponent', () => {
  const state = signal<FaceSearchDialogState>({ kind: 'searching', done: 0, total: 0, waitingForThumbnails: false });
  let cancel: Mock<() => void>;
  let fixture: ComponentFixture<FaceSearchDialogComponent>;

  /** The texts of the dialog, each line of it and the button, in their order. */
  const text = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.texts > div, .texts.message, button'))
    .map(element => element.textContent.replace(/\s+/g, ' ').trim()).join(' ');
  const button = () => (fixture.nativeElement as HTMLElement).querySelector('button');
  const progress = () => (fixture.nativeElement as HTMLElement).querySelector('mat-progress-bar');

  beforeEach(() => {
    cancel = vi.fn();
    state.set({ kind: 'searching', done: 0, total: 0, waitingForThumbnails: false });
    TestBed.configureTestingModule({
      imports: [FaceSearchDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { state, cancel } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(FaceSearchDialogComponent);
    fixture.detectChanges();
  });

  it('shows how far the search is, that it runs on this computer only, and Cancel', () => {
    state.set({ kind: 'searching', done: 3, total: 12, waitingForThumbnails: false });
    fixture.detectChanges();
    expect(text()).toBe('Looking for faces in the selected photos... Looked at 3 of 12 photos. '
      + 'Faces are looked for on this computer only. Nothing about them is sent anywhere. Cancel');
    expect(progress().getAttribute('aria-valuenow')).toBe('25');
    button().click();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('says when it waits for the thumbnails of HEIF files', () => {
    state.set({ kind: 'searching', done: 1, total: 2, waitingForThumbnails: true });
    fixture.detectChanges();
    expect(text()).toContain('Waiting for the thumbnails of HEIF files to be generated...');
  });

  it('says what came of the search, with Close', () => {
    const messages: [FaceSearchDialogState, string][] = [
      [{ kind: 'noFacesFound' }, 'No faces were found in the selected photos. The selection stays as it is.'],
      [{ kind: 'notLookedAt', count: 2 }, '2 photos could not be looked at for faces and are no longer selected.'],
      [{ kind: 'failed' }, 'Faces could not be looked for in the selected photos. The selection stays as it is.'],
    ];
    for (const [shown, message] of messages) {
      state.set(shown);
      fixture.detectChanges();
      expect(text()).toBe(`${message} Close`);
      expect(progress()).toBeNull();
    }
  });
});
