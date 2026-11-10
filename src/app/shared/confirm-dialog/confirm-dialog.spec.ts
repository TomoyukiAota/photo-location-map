import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogComponent', () => {
  it('shows the question with OK and Cancel, which close it with true and false', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { message: 'This application will restart.\nDo you want to continue?' } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('.message').textContent).toBe('This application will restart.\nDo you want to continue?');
    const [ok, cancel] = Array.from(host.querySelectorAll('button'));
    expect([ok.textContent.trim(), cancel.textContent.trim()]).toEqual(['OK', 'Cancel']);
    cancel.click();
    expect(close).toHaveBeenLastCalledWith(false);
    ok.click();
    expect(close).toHaveBeenLastCalledWith(true);
  });
});

describe('ConfirmDialogService', () => {
  /** Opens the dialog with a stand-in for MatDialog, whose dialog closes at once with `result`. */
  async function confirmWith(result: boolean | undefined) {
    const open = vi.fn().mockReturnValue({ afterClosed: () => of(result) });
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: { open } }] });
    const confirmed = await TestBed.inject(ConfirmDialogService).confirm('Do you want to continue?');
    return { confirmed, open };
  }

  it('asks the question in the application\'s own dialog, and tells that OK was clicked', async () => {
    const { confirmed, open } = await confirmWith(true);
    expect(confirmed).toBe(true);
    expect(open).toHaveBeenCalledExactlyOnceWith(ConfirmDialogComponent, expect.objectContaining({
      data: { message: 'Do you want to continue?' }, role: 'alertdialog', ariaLabel: 'Photo Location Map',
    }));
  });

  it('takes Cancel, Escape and a click outside the dialog as a refusal', async () => {
    expect((await confirmWith(false)).confirmed).toBe(false);
    TestBed.resetTestingModule();
    // Escape and a click on the backdrop close the dialog without a result.
    expect((await confirmWith(undefined)).confirmed).toBe(false);
  });
});
