import { DestroyRef, inject, Service, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { bridge } from '../../../../../src-shared/bridge/plm-bridge';
import { leafletMapLogger as logger } from '../leaflet-map-logger';

/** What put the map in full screen, or took it out. */
export type MapFullScreenTrigger = 'button' | 'menu' | 'escape' | 'window' | 'revealInSidebar';

const triggerNames: Readonly<Record<MapFullScreenTrigger, string>> = {
  button: 'Button',
  menu: 'View Menu',
  escape: 'Esc',
  window: 'Window',
  revealInSidebar: 'Reveal in Sidebar',
};

/** The input types that are not text fields, in which Esc is not the field's. */
const notTextInputTypes: ReadonlySet<string> = new Set(['button', 'checkbox', 'color', 'file', 'image', 'radio', 'range', 'reset', 'submit']);

/** Whether a key goes to a field that the user writes in, which may take Esc for itself, as a text on the map. */
function isTextField(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement)
    return !notTextInputTypes.has(target.type);
  return target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
}

/**
 * The map in full screen: the window in full screen, with the map alone in it.
 * TL;DR: While it is on, the home view hides the sidebar, the chart and their gutters (HomeComponent), and the main
 * process keeps the window in full screen (src-main/map-full-screen/), which it gives back as it was afterwards.
 * Details:
 * - The button at the map's top left (MapFullScreenButtonComponent) and the View menu's Map in Full Screen enter and
 *   leave it. Esc leaves it when nothing else takes the key: a popup of the map, a menu or a dialog that Esc closes
 *   takes it first, a dialog that Esc does not close keeps the map as it is, and so does a text field.
 * - The window leaving full screen by its own means, as View > Toggle Full Screen, ends it too.
 * - Reveal in Sidebar leaves it, to show the photo's row (MoreOptionsMenuComponent). Select Previous and Select Next go
 *   on in it, on the map: the folder tree shows the photo's row once the sidebar is shown again
 *   (DirectoryTreeViewComponent).
 * - Not saved: the application starts with the sidebar and the chart.
 */
@Service()
export class MapFullScreenService {
  private readonly dialog = inject(MatDialog);
  private readonly isOn = signal(false);
  /** Whether the map is in full screen. */
  public readonly on = this.isOn.asReadonly();

  constructor() {
    const plm = bridge();
    const unsubscribes = [
      plm.events.onToggleMapFullScreen(() => this.toggle('menu')),
      plm.events.onWindowLeftFullScreen(() => this.leave('window')),
    ];
    // On the window, which a key reaches after the page's elements and the document, where it may be taken first.
    const handleKeydown = (event: KeyboardEvent) => this.handleKeydown(event);
    window.addEventListener('keydown', handleKeydown);
    inject(DestroyRef).onDestroy(() => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      window.removeEventListener('keydown', handleKeydown);
    });
  }

  public toggle(trigger: MapFullScreenTrigger): void {
    this.set(!this.isOn(), trigger);
  }

  public enter(trigger: MapFullScreenTrigger): void {
    this.set(true, trigger);
  }

  public leave(trigger: MapFullScreenTrigger): void {
    this.set(false, trigger);
  }

  private set(on: boolean, trigger: MapFullScreenTrigger): void {
    if (on === this.isOn())
      return;
    this.isOn.set(on);
    const action = on ? 'Entered Full Screen' : 'Left Full Screen';
    logger.info(`${action} by ${triggerNames[trigger]}`);
    Analytics.trackEvent('Leaflet Map', `[Leaflet Map] ${action}`, `By: ${triggerNames[trigger]}`);
    // The window follows, unless the window itself left full screen, and the View menu's item is checked or unchecked.
    bridge().mapFullScreen.set(on)
      .catch(error => logger.error('Failed to put the window in full screen with the map, or to take it out.', error));
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.isOn() || event.defaultPrevented || event.isComposing
        || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    if (this.dialog.openDialogs.length > 0 || isTextField(event.target))
      return;
    this.leave('escape');
  }
}
