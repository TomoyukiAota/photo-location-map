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

/**
 * A drag event, as the window gets it, of a drag that carries `types` and, once dropped, `files`, from the element
 * `target` that it enters, is over or leaves.
 */
function dragEvent(types: string[], files: File[] = [], target: EventTarget | null = null) {
  const event = {
    target,
    dataTransfer: { types, files, dropEffect: 'none' as DataTransfer['dropEffect'] },
    defaultPrevented: false,
    preventDefault: () => { event.defaultPrevented = true; },
  };
  return event;
}
const asDragEvent = (event: ReturnType<typeof dragEvent>) => event as unknown as DragEvent;

/**
 * A mousemove of the window, with the movement from the one before: a move of the mouse has one, as some that Chromium
 * sends during a drag do, and the one that Blink sends when what is under the mouse changes does not.
 */
const mouseMove = (movementX: number, movementY: number) =>
  window.dispatchEvent(new MouseEvent('mousemove', { movementX, movementY }));

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

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('takes a drag of files from the window, with the copy cursor and the hint, and leaves other drags to the page', () => {
    const text = dragEvent(['text/plain'], [], document.body);
    service.dragEnter(asDragEvent(text));
    service.dragOver(asDragEvent(text));
    expect(text.defaultPrevented).toBe(false);
    expect(text.dataTransfer.dropEffect).toBe('none');
    expect(service.showsHint()).toBe(false);

    const files = dragEvent(['Files'], [], document.body);
    service.dragEnter(asDragEvent(files));
    service.dragOver(asDragEvent(files));
    expect(files.defaultPrevented).toBe(true);
    expect(files.dataTransfer.dropEffect).toBe('copy');
    expect(service.showsHint()).toBe(true);
  });

  describe('the hint over the window', () => {
    /** An element of the page, which the files are dragged over. */
    const element = () => document.body.appendChild(document.createElement('div'));
    const files = (target: EventTarget) => asDragEvent(dragEvent(['Files'], [], target));

    it('is shown while files are dragged over the window, and hidden once they leave it', () => {
      const map = element();
      const tree = element();
      service.dragEnter(files(map));
      expect(service.showsHint()).toBe(true);
      // To another element, which the drag enters before it leaves the one before.
      service.dragEnter(files(tree));
      service.dragLeave(files(map));
      service.dragOver(files(tree));
      expect(service.showsHint()).toBe(true);
      // Out of the window.
      service.dragLeave(files(tree));
      expect(service.showsHint()).toBe(false);
    });

    it('is hidden once the files are dropped', async () => {
      service.dragEnter(files(element()));
      const drop = service.drop(asDragEvent(dragEvent(['Files'], [dropped('trip')])));
      expect(service.showsHint()).toBe(false);
      await drop;
      expect(open).toHaveBeenCalledOnce();
    });

    it('is not shown while a drop is refused, and is once it is taken again during the drag', () => {
      openDialogs = [{}];
      const map = element();
      const enter = dragEvent(['Files'], [], map);
      service.dragEnter(asDragEvent(enter));
      expect(enter.dataTransfer.dropEffect).toBe('none');
      expect(service.showsHint()).toBe(false);
      // The dialog is closed while the files are over the window.
      openDialogs = [];
      service.dragOver(files(map));
      expect(service.showsHint()).toBe(true);
      service.dragLeave(files(map));
      expect(service.showsHint()).toBe(false);
    });

    it('is hidden once the files leave the window, though an element that they entered has left the page', () => {
      const row = element();
      const map = element();
      service.dragEnter(files(row));
      service.dragEnter(files(map));
      // The row is taken out of the page, as the tree does with a row far from its view: no dragleave comes from it.
      row.remove();
      service.dragLeave(files(map));
      expect(service.showsHint()).toBe(false);
    });

    it('is hidden once the mouse has moved with no event of a drag, in case one of the drag\'s events was missed', () => {
      vi.useFakeTimers();
      service.dragEnter(files(element()));
      mouseMove(3, 2);
      expect(service.showsHint()).toBe(true);
      vi.runOnlyPendingTimers();
      expect(service.showsHint()).toBe(false);
      // The next drag is followed as the first was.
      const map = element();
      service.dragEnter(files(map));
      service.dragLeave(files(map));
      expect(service.showsHint()).toBe(false);
    });

    it('is kept while the drag goes on, though Chromium sends mousemoves during it', () => {
      vi.useFakeTimers();
      const map = element();
      service.dragEnter(files(map));
      // Blink's, when what is under the mouse changes.
      mouseMove(0, 0);
      vi.runOnlyPendingTimers();
      expect(service.showsHint()).toBe(true);
      // One with a movement, which the drag's next event follows.
      mouseMove(217, 185);
      vi.advanceTimersByTime(5);
      service.dragOver(files(map));
      vi.runOnlyPendingTimers();
      expect(service.showsHint()).toBe(true);
      service.dragLeave(files(map));
      expect(service.showsHint()).toBe(false);
    });

    it('is not shown for a drag that starts in the page, which is left to the page until it ends', async () => {
      vi.useFakeTimers();
      service.dragStart();
      const over = dragEvent(['Files'], [], element());
      service.dragEnter(asDragEvent(over));
      // Chromium's mousemoves during the drag do not end it.
      mouseMove(4, 0);
      service.dragOver(asDragEvent(over));
      vi.runOnlyPendingTimers();
      service.dragOver(asDragEvent(over));
      expect(over.defaultPrevented).toBe(false);
      expect(service.showsHint()).toBe(false);
      const drop = dragEvent(['Files'], [dropped('trip')]);
      await service.drop(asDragEvent(drop));
      expect(drop.defaultPrevented).toBe(false);
      expect(openTarget).not.toHaveBeenCalled();

      // It ends with its dragend, or once the mouse has moved with no event of a drag, when its dragend is missed.
      const moveMouse = () => {
        mouseMove(4, 0);
        vi.runOnlyPendingTimers();
      };
      for (const end of [() => service.dragEnd(), moveMouse]) {
        service.dragStart();
        end();
        const map = element();
        service.dragEnter(files(map));
        expect(service.showsHint()).toBe(true);
        service.dragLeave(files(map));
      }
    });
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
      // Taken, so that the window does not load what is dropped, with no effect, and no hint.
      expect(over.defaultPrevented).toBe(true);
      expect(over.dataTransfer.dropEffect).toBe('none');
      expect(service.showsHint()).toBe(false);
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
