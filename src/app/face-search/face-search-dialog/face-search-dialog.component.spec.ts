import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FaceSearchDialogComponent, FaceSearchDialogState } from './face-search-dialog.component';
import type { Mock } from 'vitest';

describe('FaceSearchDialogComponent', () => {
  const state = signal<FaceSearchDialogState>({ kind: 'searching', done: 0, total: 0, waitingForThumbnails: false });
  const photoCount = signal(12);
  let cancel: Mock<() => void>;
  let fixture: ComponentFixture<FaceSearchDialogComponent>;

  const root = () => fixture.nativeElement as HTMLElement;
  /** The state that is shown: the others are laid out under it, unseen. */
  const shown = () => root().querySelector('.state.shown');
  /** The texts that are shown, each line and the button, in their order, without those that only keep their room. */
  const text = () => Array.from(shown().querySelectorAll('.texts > div:not(.not-now), .texts.message, button'))
    .map(element => Array.from(element.childNodes)
      .filter(node => node.nodeType !== Node.COMMENT_NODE && !(node instanceof HTMLElement && node.classList.contains('sizer')))
      .map(node => node.textContent).join(''))
    .map(line => line.replace(/\s+/g, ' ').trim()).join(' ');
  const button = () => shown().querySelector('button');
  const progress = () => shown().querySelector('mat-progress-bar');

  beforeEach(() => {
    cancel = vi.fn();
    state.set({ kind: 'searching', done: 0, total: 0, waitingForThumbnails: false });
    photoCount.set(12);
    TestBed.configureTestingModule({
      imports: [FaceSearchDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { state, photoCount, cancel } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(FaceSearchDialogComponent);
    fixture.detectChanges();
  });

  it('shows how far the search is, that it runs on this computer only, and Cancel', () => {
    state.set({ kind: 'searching', done: 3, total: 12, waitingForThumbnails: false });
    fixture.detectChanges();
    expect(text()).toBe('Looking for faces in the selected photos... Photos looked at: 3 of 12. '
      + 'Faces are looked for on this computer only. Nothing about them is sent anywhere. Cancel');
    expect(progress().getAttribute('aria-valuenow')).toBe('25');
    expect(progress().getAttribute('aria-label')).toBe('Looking for faces in the selected photos...');
    button().click();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('says when it waits for the thumbnails of HEIF files', () => {
    state.set({ kind: 'searching', done: 1, total: 2, waitingForThumbnails: true });
    fixture.detectChanges();
    expect(text()).toContain('Waiting for the thumbnails of HEIF files to be generated...');
  });

  it('lays out every state, one on top of another, and shows the one that applies, so that it keeps its height', () => {
    // jsdom lays nothing out: the e2e suite measures the heights.
    state.set({ kind: 'searching', done: 3, total: 12, waitingForThumbnails: false });
    fixture.detectChanges();
    expect(root().querySelectorAll('.state')).toHaveLength(4);
    expect(root().querySelectorAll('.state.shown')).toHaveLength(1);
    // The line about the thumbnails keeps its room while the search does not wait, and the lines with a number keep
    // that of the largest number, the selected photos'.
    expect(shown().querySelector('.waiting').classList).toContain('not-now');
    expect(shown().querySelector('.with-number .sizer').textContent).toBe('Photos looked at: 12 of 12.');
    state.set({ kind: 'notLookedAt', count: 1 });
    fixture.detectChanges();
    expect(shown().querySelector('.sizer').textContent)
      .toBe('Photos that could not be looked at for faces and are no longer selected: 12.');
  });

  it('says what came of the search, with Close', () => {
    const messages: [FaceSearchDialogState, string][] = [
      [{ kind: 'noFacesFound' }, 'No faces were found in the selected photos. The selection stays as it is.'],
      [{ kind: 'notLookedAt', count: 1 }, 'Photos that could not be looked at for faces and are no longer selected: 1.'],
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
