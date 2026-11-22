import {
  acceleratorOf,
  ariaKeyShortcutsOf,
  isShortcut,
  isWithCmdOrCtrl,
  PressedKey,
  selectNextShortcut,
  selectPreviousShortcut,
  shortcutText,
} from './shortcut.js';

/** A key pressed with the modifiers given, and no others. */
function pressed(key: string, modifiers: Partial<Omit<PressedKey, 'key'>> = {}): PressedKey {
  return { key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...modifiers };
}

describe('Shortcut', () => {
  it('gives Electron Photo Taken Before and Photo Taken After as CmdOrCtrl with the arrows', () => {
    expect(acceleratorOf(selectPreviousShortcut)).toBe('CmdOrCtrl+Left');
    expect(acceleratorOf(selectNextShortcut)).toBe('CmdOrCtrl+Right');
  });

  it('is shown with ⌘ on macOS, and with the Ctrl key\'s name on Windows and Linux', () => {
    expect(shortcutText(selectPreviousShortcut, 'darwin')).toBe('⌘←');
    expect(shortcutText(selectNextShortcut, 'darwin')).toBe('⌘→');
    for (const platform of ['win32', 'linux']) {
      expect(shortcutText(selectPreviousShortcut, platform)).toBe('Ctrl+←');
      expect(shortcutText(selectNextShortcut, platform)).toBe('Ctrl+→');
    }
  });

  it('is told to a screen reader by the keys\' names', () => {
    expect(ariaKeyShortcutsOf(selectNextShortcut, 'darwin')).toBe('Meta+ArrowRight');
    expect(ariaKeyShortcutsOf(selectNextShortcut, 'win32')).toBe('Control+ArrowRight');
  });

  it('is pressed with Cmd on macOS, and with Ctrl on Windows and Linux, and no other modifier', () => {
    expect(isShortcut(pressed('ArrowRight', { metaKey: true }), selectNextShortcut, 'darwin')).toBe(true);
    expect(isShortcut(pressed('ArrowRight', { ctrlKey: true }), selectNextShortcut, 'darwin')).toBe(false);
    expect(isShortcut(pressed('ArrowRight', { metaKey: true, shiftKey: true }), selectNextShortcut, 'darwin')).toBe(false);
    expect(isShortcut(pressed('ArrowRight', { metaKey: true, ctrlKey: true }), selectNextShortcut, 'darwin')).toBe(false);
    expect(isShortcut(pressed('ArrowRight'), selectNextShortcut, 'darwin')).toBe(false);
    expect(isShortcut(pressed('ArrowLeft', { metaKey: true }), selectNextShortcut, 'darwin')).toBe(false);
    for (const platform of ['win32', 'linux']) {
      expect(isShortcut(pressed('ArrowLeft', { ctrlKey: true }), selectPreviousShortcut, platform)).toBe(true);
      expect(isShortcut(pressed('ArrowLeft', { metaKey: true }), selectPreviousShortcut, platform)).toBe(false);
      expect(isShortcut(pressed('ArrowLeft', { ctrlKey: true, altKey: true }), selectPreviousShortcut, platform)).toBe(false);
    }
  });

  it('tells a key pressed with Cmd or Ctrl, whatever the key and the other modifiers, from the modifiers pressed first', () => {
    expect(isWithCmdOrCtrl(pressed('z', { metaKey: true }), 'darwin')).toBe(true);
    expect(isWithCmdOrCtrl(pressed('f', { metaKey: true, ctrlKey: true }), 'darwin')).toBe(true);
    expect(isWithCmdOrCtrl(pressed('z', { ctrlKey: true }), 'darwin')).toBe(false);
    expect(isWithCmdOrCtrl(pressed('Meta', { metaKey: true }), 'darwin')).toBe(false);
    expect(isWithCmdOrCtrl(pressed('Shift', { metaKey: true, shiftKey: true }), 'darwin')).toBe(false);
    expect(isWithCmdOrCtrl(pressed('y', { ctrlKey: true }), 'win32')).toBe(true);
    expect(isWithCmdOrCtrl(pressed('I', { ctrlKey: true, shiftKey: true }), 'linux')).toBe(true);
    expect(isWithCmdOrCtrl(pressed('Control', { ctrlKey: true }), 'win32')).toBe(false);
    expect(isWithCmdOrCtrl(pressed('ArrowRight'), 'win32')).toBe(false);
  });
});
