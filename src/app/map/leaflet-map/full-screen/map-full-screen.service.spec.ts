import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MapFullScreenService } from './map-full-screen.service';

describe('MapFullScreenService', () => {
  let service: MapFullScreenService;
  let set: ReturnType<typeof vi.spyOn>;
  let toggleFromMenu: () => void;
  let windowLeftFullScreen: () => void;
  let openDialogs: unknown[];

  /** Presses a key in the page, on `target`, as the user does: the event goes up to the window. */
  function press(key: string, target: HTMLElement = document.body, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    set = vi.spyOn(window.plm.mapFullScreen, 'set');
    vi.spyOn(window.plm.events, 'onToggleMapFullScreen').mockImplementation(listener => {
      toggleFromMenu = listener;
      return () => undefined;
    });
    vi.spyOn(window.plm.events, 'onWindowLeftFullScreen').mockImplementation(listener => {
      windowLeftFullScreen = listener;
      return () => undefined;
    });
    openDialogs = [];
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: { get openDialogs() { return openDialogs; } } }] });
    service = TestBed.inject(MapFullScreenService);
  });

  it('starts out of full screen, and tells the main process of each change, which the window follows', () => {
    expect(service.on()).toBe(false);

    service.enter('button');
    service.enter('button');
    expect(service.on()).toBe(true);
    service.leave('button');
    service.leave('button');
    expect(service.on()).toBe(false);

    expect(set.mock.calls).toEqual([[true], [false]]);
  });

  it('is entered and left by the View menu\'s item', () => {
    toggleFromMenu();
    expect(service.on()).toBe(true);
    toggleFromMenu();
    expect(service.on()).toBe(false);
  });

  it('ends with the window\'s full screen, whatever ends it', () => {
    service.enter('button');

    windowLeftFullScreen();

    expect(service.on()).toBe(false);
    expect(set.mock.calls).toEqual([[true], [false]]);
  });

  it('is left by Esc', () => {
    service.enter('button');

    press('Escape');

    expect(service.on()).toBe(false);
  });

  it('leaves Esc to what takes it first, to a dialog, to a text field, and to the key with a modifier', () => {
    service.enter('button');
    // A popup of the map, a menu or a dialog that Esc closes, which prevents the key's default.
    const closesSomething = (event: KeyboardEvent) => event.preventDefault();
    document.addEventListener('keydown', closesSomething);
    try {
      press('Escape');
    } finally {
      document.removeEventListener('keydown', closesSomething);
    }
    expect(service.on()).toBe(true);

    // A dialog that Esc does not close.
    openDialogs = [{}];
    press('Escape');
    expect(service.on()).toBe(true);
    openDialogs = [];

    const textArea = document.body.appendChild(document.createElement('textarea'));
    const checkbox = document.body.appendChild(Object.assign(document.createElement('input'), { type: 'checkbox' }));
    try {
      press('Escape', textArea);
      expect(service.on()).toBe(true);

      for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])
        press('Escape', document.body, { [modifier]: true });
      press('Escape', document.body, { isComposing: true });
      press('Enter');
      expect(service.on()).toBe(true);

      // A checkbox, as the date box's, does not take Esc.
      press('Escape', checkbox);
      expect(service.on()).toBe(false);
    } finally {
      textArea.remove();
      checkbox.remove();
    }
  });

  it('does nothing with Esc out of full screen', () => {
    press('Escape');

    expect(service.on()).toBe(false);
    expect(set).not.toHaveBeenCalled();
  });
});
