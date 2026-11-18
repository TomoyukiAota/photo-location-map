import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import type { OpenTarget } from '../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../src-shared/log/logger';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { OpenTargetService } from '../shared/service/open-target.service';
import { ThumbnailGenerationService } from '../thumbnail-generation/service/thumbnail-generation.service';
import { DropToOpenService } from './drop-to-open.service';
import type { Mock } from 'vitest';

/** A drag event, as the window gets it, of a drag that carries `types` and, once dropped, `files`. */
function dragEvent(types: string[], files: File[] = []) {
  const event = {
    dataTransfer: { types, files, dropEffect: 'none' as DataTransfer['dropEffect'] },
    defaultPrevented: false,
    preventDefault: () => { event.defaultPrevented = true; },
  };
  return event;
}
const asDragEvent = (event: ReturnType<typeof dragEvent>) => event as unknown as DragEvent;

/** A File of a drop. The bridge's double answers for it by its name, as the main process does by its path. */
const dropped = (name: string) => new File([], name);

describe('DropToOpenService', () => {
  let service: DropToOpenService;
  let openDialogs: unknown[];
  let isGenerating: WritableSignal<boolean>;
  let confirm: Mock<ConfirmDialogService['confirm']>;
  let open: Mock<OpenTargetService['open']>;
  /** What the main process answers for each dropped File, by its name. */
  let targets: Record<string, OpenTarget>;
  let openTarget: Mock<(file: File) => Promise<OpenTarget>>;
  let choose: Mock<(file: File) => Promise<OpenTarget>>;

  beforeEach(() => {
    openDialogs = [];
    isGenerating = signal(false);
    confirm = vi.fn(async () => true);
    open = vi.fn(async () => {});
    targets = {
      'trip': { kind: 'directory', path: '/photos/trip' },
      'a.jpg': { kind: 'file', path: '/photos/trip/a.jpg', parentFolderPath: '/photos/trip' },
      'made by the page': { kind: 'none' },
    };
    openTarget = vi.fn(async (file: File) => targets[file.name]);
    choose = vi.fn(async (file: File) => targets[file.name]);
    window.plm = { ...window.plm, droppedItem: { openTarget, choose } };
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: { get openDialogs() { return openDialogs; } } },
        { provide: ThumbnailGenerationService, useValue: { isGenerating } },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: OpenTargetService, useValue: { open } },
      ],
    });
    service = TestBed.inject(DropToOpenService);
  });

  it('takes a drag of files from the window, with the copy cursor, and leaves other drags to the page', () => {
    const files = dragEvent(['Files']);
    service.dragOver(asDragEvent(files));
    expect(files.defaultPrevented).toBe(true);
    expect(files.dataTransfer.dropEffect).toBe('copy');

    const text = dragEvent(['text/plain']);
    service.dragOver(asDragEvent(text));
    expect(text.defaultPrevented).toBe(false);
    expect(text.dataTransfer.dropEffect).toBe('none');
  });

  it('asks whether to open a dropped folder, with its path, and opens it once the user clicks OK', async () => {
    const drop = dragEvent(['Files'], [dropped('trip')]);
    await service.drop(asDragEvent(drop));
    // The window would otherwise load the folder in place of the application.
    expect(drop.defaultPrevented).toBe(true);
    expect(confirm).toHaveBeenCalledExactlyOnceWith('Do you want to open the folder below?', '/photos/trip');
    // The main process is given the File, never a path, both times.
    expect(openTarget).toHaveBeenCalledExactlyOnceWith(drop.dataTransfer.files[0]);
    expect(choose).toHaveBeenCalledExactlyOnceWith(drop.dataTransfer.files[0]);
    expect(open).toHaveBeenCalledExactlyOnceWith({ kind: 'directory', path: '/photos/trip' }, 'Drop to Open');
  });

  it('asks whether to open a dropped file, and opens its folder as --open does, with the file to select', async () => {
    await service.drop(asDragEvent(dragEvent(['Files'], [dropped('a.jpg')])));
    expect(confirm).toHaveBeenCalledExactlyOnceWith('Do you want to open the file below?', '/photos/trip/a.jpg');
    expect(open).toHaveBeenCalledExactlyOnceWith(targets['a.jpg'], 'Drop to Open');
  });

  it('opens nothing, and does not choose the folder, when the user clicks Cancel', async () => {
    confirm.mockResolvedValue(false);
    await service.drop(asDragEvent(dragEvent(['Files'], [dropped('trip')])));
    expect(confirm).toHaveBeenCalledOnce();
    expect(choose).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it('asks about the first of several dropped items only', async () => {
    await service.drop(asDragEvent(dragEvent(['Files'], [dropped('a.jpg'), dropped('trip')])));
    expect(confirm).toHaveBeenCalledExactlyOnceWith('Do you want to open the file below?', '/photos/trip/a.jpg');
    expect(open).toHaveBeenCalledExactlyOnceWith(targets['a.jpg'], 'Drop to Open');
  });

  it('asks nothing for what opens nothing, such as a File that is not on the disk, or a drop without files', async () => {
    targets['gone'] = { kind: 'failed', path: '/photos/gone', message: 'ENOENT: no such file or directory' };
    for (const files of [[dropped('made by the page')], [dropped('gone')], []]) {
      const drop = dragEvent(['Files'], files);
      await service.drop(asDragEvent(drop));
      expect(drop.defaultPrevented).toBe(true);
    }
    expect(confirm).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it('refuses a drop, with the cursor that says no, while a dialog is open or thumbnails are generated', async () => {
    for (const [dialogs, generating] of [[[{}], false], [[], true]] as const) {
      openDialogs = [...dialogs];
      isGenerating.set(generating);
      const over = dragEvent(['Files']);
      service.dragOver(asDragEvent(over));
      // Taken, so that the window does not load what is dropped, with no effect.
      expect(over.defaultPrevented).toBe(true);
      expect(over.dataTransfer.dropEffect).toBe('none');
      const drop = dragEvent(['Files'], [dropped('trip')]);
      await service.drop(asDragEvent(drop));
      expect(drop.defaultPrevented).toBe(true);
    }
    expect(openTarget).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('refuses another drop while one is being asked about, and takes one again after it', async () => {
    let answer: (ok: boolean) => void;
    confirm.mockImplementationOnce(() => new Promise(resolve => { answer = resolve; }));
    const first = service.drop(asDragEvent(dragEvent(['Files'], [dropped('trip')])));
    await vi.waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    const over = dragEvent(['Files']);
    service.dragOver(asDragEvent(over));
    expect(over.dataTransfer.dropEffect).toBe('none');
    await service.drop(asDragEvent(dragEvent(['Files'], [dropped('a.jpg')])));
    expect(openTarget).toHaveBeenCalledOnce();

    answer(true);
    await first;
    expect(open).toHaveBeenCalledExactlyOnceWith(targets['trip'], 'Drop to Open');
    const after = dragEvent(['Files']);
    service.dragOver(asDragEvent(after));
    expect(after.dataTransfer.dropEffect).toBe('copy');
  });

  it('does not open what can no longer be opened once the user has clicked OK', async () => {
    const warn = vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);
    // Thumbnails began to be generated while the question was asked.
    confirm.mockImplementationOnce(async () => { isGenerating.set(true); return true; });
    await service.drop(asDragEvent(dragEvent(['Files'], [dropped('trip')])));
    expect(choose).not.toHaveBeenCalled();
    // The item was removed while the question was asked.
    isGenerating.set(false);
    choose.mockResolvedValueOnce({ kind: 'failed', path: '/photos/trip', message: 'ENOENT: no such file or directory' });
    await service.drop(asDragEvent(dragEvent(['Files'], [dropped('trip')])));
    expect(choose).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
