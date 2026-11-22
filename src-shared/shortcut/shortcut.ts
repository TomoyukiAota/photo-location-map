import { t } from '../i18n/i18n.js';

/**
 * A shortcut of the application: a key with Cmd on macOS, and with Ctrl on Windows and Linux, the modifier that
 * Electron's accelerators name CmdOrCtrl.
 * TL;DR: The application menu has the shortcuts of its items, and a photo's menu, which has some of the same items,
 * shows their shortcuts and takes them while it is open: each is written once here, for both.
 * Details: The Selection menu (src-main/menu/selection-menu.ts) gives Electron the accelerators, and says why these
 * keys. A photo's menu (src/app/photo-info-viewer/more-options-menu/) shows a shortcut as the menus of macOS show it,
 * ⌘←, and as Windows and Linux write one, Ctrl+←, with the arrow of the key's cap.
 */
export interface Shortcut {
  /** The key, as Electron's accelerators name it: `Left`. */
  readonly acceleratorKey: string;
  /** The key, as KeyboardEvent.key names it: `ArrowLeft`. */
  readonly key: string;
  /** The key, as its cap and the menus of macOS show it: `←`. */
  readonly symbol: string;
}

/** What a key event says of the key that is pressed and of the modifiers held with it, as KeyboardEvent does. */
export interface PressedKey {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}

/** Photo Taken Before: the arrow towards the photos taken earlier, as the chart lays the time out. */
export const selectPreviousShortcut: Shortcut = { acceleratorKey: 'Left', key: 'ArrowLeft', symbol: '←' };

/** Photo Taken After: the arrow towards the photos taken later. */
export const selectNextShortcut: Shortcut = { acceleratorKey: 'Right', key: 'ArrowRight', symbol: '→' };

const modifierKeys: readonly string[] = ['Meta', 'Control', 'Alt', 'Shift'];

/** The shortcut as Electron's menus take it: `CmdOrCtrl+Left`. */
export function acceleratorOf(shortcut: Shortcut): string {
  return `CmdOrCtrl+${shortcut.acceleratorKey}`;
}

/**
 * The shortcut as a menu shows it beside its item on `platform` (process.platform): `⌘←` on macOS, and `Ctrl+←` on
 * Windows and Linux, with the Ctrl key as the keyboards of the application's language name it (`Strg+←` in German).
 */
export function shortcutText(shortcut: Shortcut, platform: string): string {
  return platform === 'darwin' ? `⌘${shortcut.symbol}` : `${t('common.ctrlKey')}+${shortcut.symbol}`;
}

/**
 * The shortcut for the attribute aria-keyshortcuts of its item, which a screen reader tells of, as it would read the
 * shown text as two symbols: `Meta+ArrowLeft` on macOS, `Control+ArrowLeft` on Windows and Linux.
 */
export function ariaKeyShortcutsOf(shortcut: Shortcut, platform: string): string {
  return `${platform === 'darwin' ? 'Meta' : 'Control'}+${shortcut.key}`;
}

/**
 * Whether the key pressed is the shortcut on `platform`: its key with Cmd on macOS, or with Ctrl on Windows and Linux,
 * and no other modifier, as Electron matches an accelerator.
 */
export function isShortcut(pressed: PressedKey, shortcut: Shortcut, platform: string): boolean {
  const mac = platform === 'darwin';
  return pressed.key === shortcut.key && pressed.metaKey === mac && pressed.ctrlKey === !mac
    && !pressed.altKey && !pressed.shiftKey;
}

/**
 * Whether a key is pressed with Cmd on macOS, or with Ctrl on Windows and Linux: a shortcut of the application, or one
 * that may be, whatever its key and the other modifiers. Not Cmd or Ctrl itself, nor another modifier, pressed first.
 */
export function isWithCmdOrCtrl(pressed: PressedKey, platform: string): boolean {
  return (platform === 'darwin' ? pressed.metaKey : pressed.ctrlKey) && !modifierKeys.includes(pressed.key);
}
