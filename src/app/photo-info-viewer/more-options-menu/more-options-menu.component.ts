import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, Directive, inject, Injector, input, viewChild } from '@angular/core';
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
import {
  ariaKeyShortcutsOf,
  isShortcut,
  isWithCmdOrCtrl,
  PressedKey,
  selectNextShortcut,
  selectPreviousShortcut,
  Shortcut,
  shortcutText,
} from '../../../../src-shared/shortcut/shortcut';
import { currentPlatform } from '../../../../src-shared/startup/startup-metadata';
import { openUrl } from '../../../../src-shared/url/open-url';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { Photo } from '../../shared/model/photo.model';
import { openContainingFolder } from '../../shared/open-with-os';
import { PhotoRevealService } from '../../shared/service/photo-reveal.service';
import { SelectPreviousNextService } from '../../shared/service/select-previous-next.service';
import { photoInfoViewerLogger as logger } from '../photo-info-viewer-logger';
import { PhotoInfoViewerPlace } from '../photo-info-viewer-place';
import { MoreOptionsMenuService } from './more-options-menu.service';
import { requestMainProcessToLaunchPhotoDataViewer } from './view-data/request-main-process-to-launch-photo-data-viewer';

/** What a photo's More Options button gives the menu when it opens it (matMenuTriggerData). */
export interface MoreOptionsMenuData {
  readonly photo: Photo;
  /** Where the photo is shown, which decides the item that shows it in the other place. */
  readonly place: PhotoInfoViewerPlace;
}

/** How an item was chosen, as the log and the analytics say it. */
type ChosenWith = 'click' | 'shortcut';

const chosenWithInLog: Readonly<Record<ChosenWith, string>> = { click: 'Clicked', shortcut: 'Pressed the shortcut of' };
const chosenWithInAnalytics: Readonly<Record<ChosenWith, string>> = { click: 'Clicked', shortcut: 'Pressed Shortcut of' };

/** An item's shortcut, as the item shows it and tells a screen reader of it. */
interface MoreOptionsMenuShortcut {
  readonly shortcut: Shortcut;
  /** Beside the item's text: `⌘←` on macOS (shortcutText()). */
  readonly text: string;
  /** For the item's aria-keyshortcuts. */
  readonly ariaKeyShortcuts: string;
}

/** An item of the menu, which does what it says, or opens one of the menu's submenus. */
export interface MoreOptionsMenuItem {
  readonly textKey: TranslationKey;
  /** Does what the item says, chosen with a click or, for an item that has one, with its shortcut. */
  readonly choose?: (chosenWith: ChosenWith) => void;
  /** Select Previous or Select Next for a photo that has no photo before or after it: shown, and not chosen. */
  readonly disabled?: boolean;
  /** The shortcut of the application menu's same item, for the one selected photo, which chooses this one here. */
  readonly shortcut?: MoreOptionsMenuShortcut;
  readonly submenu?: {
    readonly name: 'selection' | 'google';
    readonly items: readonly MoreOptionsMenuItem[];
  };
}

/** The item of `items`, or of their submenus, whose shortcut the key pressed is. */
function itemWithShortcut(items: readonly MoreOptionsMenuItem[], pressed: PressedKey, platform: string): MoreOptionsMenuItem | null {
  for (const item of items) {
    if (item.shortcut && isShortcut(pressed, item.shortcut.shortcut, platform))
      return item;
    const inSubmenu = item.submenu ? itemWithShortcut(item.submenu.items, pressed, platform) : null;
    if (inSubmenu)
      return inSubmenu;
  }
  return null;
}

/**
 * While the menu is open, a press or a turn of the mouse wheel elsewhere closes it, and goes on to what it is on.
 * TL;DR: As when the menu was inside its button, which lost the focus to whatever was pressed: one click on another
 * photo's button or marker closes the menu and opens that one.
 * Details: Angular Material's menu closes on a press elsewhere only through a backdrop over the window, which takes the
 * press, and the wheel too. Without one, the menu, which is above the window rather than in its row or popup, would
 * also stay where it is while the tree scrolls or the map pans or zooms under it: the wheel closes it, before the tree
 * or the map moves. The listeners are on the document, in the capture phase, as Leaflet keeps some events from going
 * further, and are there while the menu's content is: from when the menu opens until it has closed. The menus are in
 * the overlay container. The open button, whose click closes the menu itself, is left to do so.
 */
@Directive({ selector: '[appClosesOnPressElsewhere]' })
export class ClosesOnPressElsewhereDirective {
  constructor() {
    const menu = inject(MatMenu);
    const document = inject(DOCUMENT);
    const closeIfElsewhere = (event: Event) => {
      const target = event.target as Element | null;
      if (target?.closest?.('.cdk-overlay-container, .mat-mdc-menu-trigger[aria-expanded="true"]'))
        return;
      // As the menu's trigger closes it (MatMenuTrigger.closeMenu()).
      menu.closed.emit();
    };
    document.addEventListener('pointerdown', closeIfElsewhere, true);
    document.addEventListener('wheel', closeIfElsewhere, { capture: true, passive: true });
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('pointerdown', closeIfElsewhere, true);
      document.removeEventListener('wheel', closeIfElsewhere, { capture: true });
    });
  }
}

/**
 * While the menu is open, the shortcut of one of its items chooses that item, for the menu's photo, and closes the
 * menu; any other shortcut of the application closes the menu, and goes on to the application menu.
 * TL;DR: As in the menus of macOS and Windows, a shortcut that a menu shows beside an item chooses the item there.
 * The application menu's Photo Taken Before and Photo Taken After, which have the same shortcuts, are for the one
 * selected photo, which need not be the menu's, and would leave the menu open.
 * Details:
 * - The listener is on the document, in the capture phase, from when the menu opens until it has closed: a key goes
 *   to it before the menus' own listeners, which take Left and Right, with a modifier or without, to close and to open
 *   a submenu.
 * - A shortcut that the menu takes goes no further: Electron gives an accelerator only a key that the page leaves
 *   unhandled (src-main/menu/selection-menu.ts). An item that cannot be chosen takes its shortcut too, which then does
 *   nothing, and the menu stays open with the item as it is shown.
 * - Any other key pressed with Cmd, on macOS, or with Ctrl, on Windows and Linux, such as Undo's, goes on to the
 *   application menu, and closes the menu, as a press elsewhere does: the key acts on the window around the menu.
 * - The menu takes a key once: those that come while it closes, as when a shortcut is held down, go on to the
 *   application menu, which then goes on from the photo that the menu has selected.
 */
@Directive({ selector: '[appTakesShortcuts]' })
export class TakesShortcutsDirective {
  /** The menu's items, with those of its submenus. */
  public readonly items = input.required<readonly MoreOptionsMenuItem[]>({ alias: 'appTakesShortcuts' });

  constructor() {
    const menu = inject(MatMenu);
    const document = inject(DOCUMENT);
    const platform = currentPlatform();
    let closing = false;
    const takeShortcut = (event: KeyboardEvent) => {
      if (closing || !isWithCmdOrCtrl(event, platform))
        return;
      const item = itemWithShortcut(this.items(), event, platform);
      if (item) {
        event.preventDefault();
        event.stopPropagation();
        if (item.disabled)
          return;
        item.choose?.('shortcut');
      }
      closing = true;
      // As Escape closes the menu (MatMenu._handleKeydown()).
      menu.closed.emit('keydown');
    };
    document.addEventListener('keydown', takeShortcut, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('keydown', takeShortcut, true));
  }
}

/**
 * The menu of a photo's More Options button: what else can be done with the photo. The home view has it once, for
 * every photo (MoreOptionsMenuService).
 * TL;DR: Selection and Google are submenus, of the items that select a photo and of those that open Google's sites,
 * around the items that show the photo in the other part of the window and open its folder, and before View Data.
 * Details:
 * - The button gives the menu its photo and place when it opens it, and the menu makes its items for them then.
 * - Angular Material's menu, as the tree's context menu and the sidebar's Sort menu are: a submenu opens when the
 *   pointer is on its item, when the item is clicked, and with Enter, Space or the arrow towards the submenu; the
 *   keyboard goes through the items; a screen reader is told of the menus and their items.
 * - The menu is above the window, so that neither the sidebar nor the map cuts it off at its edge. It opens below its
 *   button, at the button's end, or above the button where the window has no room below. A submenu opens beside its
 *   item, towards the end of the line, or the other way where the window has no room; in a language written from
 *   right to left, all of it is the other way round.
 * - Select Previous and Select Next, shown as Photo Taken Before and Photo Taken After, keep their places in the Select
 *   submenu where no photo was taken before or after, and cannot be chosen there, as in the application's Selection
 *   menu. They show the shortcuts that they have there, which choose them here while the menu is open
 *   (TakesShortcutsDirective).
 */
@Component({
  selector: 'app-photo-info-viewer-more-options-menu',
  templateUrl: './more-options-menu.component.html',
  styleUrl: './more-options-menu.component.scss',
  imports: [ClosesOnPressElsewhereDirective, MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger, TakesShortcutsDirective, TranslatePipe],
})
export class MoreOptionsMenuComponent {
  private readonly directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private readonly photoRevealService = inject(PhotoRevealService);
  private readonly selectPreviousNextService = inject(SelectPreviousNextService);

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  private readonly menu = viewChild.required<MatMenu>('menu');
  private readonly platform = currentPlatform();

  /**
   * The items last made, for a photo, its place and the photos taken before and after it (itemsOf()): the template
   * gets the same items, and their submenus the same data, each time that it is checked while the menu is open.
   */
  private shown: {
    readonly photo: Photo;
    readonly place: PhotoInfoViewerPlace;
    readonly previous: string | null;
    readonly next: string | null;
    readonly items: readonly MoreOptionsMenuItem[];
  } | null = null;

  constructor() {
    const service = inject(MoreOptionsMenuService);
    afterNextRender(() => service.menu.set(this.menu()));
    inject(DestroyRef).onDestroy(() => service.menu.set(null));
  }

  /**
   * The menu's items for the photo, with those of its submenus. A photo without a location has no item that needs
   * one. A row of the folder tree has the item that shows the photo on the map, and a popup of the map the one that
   * shows it in the folder tree.
   */
  protected itemsOf(photo: Photo, place: PhotoInfoViewerPlace): readonly MoreOptionsMenuItem[] {
    const previous = photo.hasGpsInfo ? this.selectPreviousNextService.previousOf(photo.path) : null;
    const next = photo.hasGpsInfo ? this.selectPreviousNextService.nextOf(photo.path) : null;
    const shown = this.shown;
    if (shown?.photo === photo && shown.place === place && shown.previous === previous && shown.next === next)
      return shown.items;
    const items = this.makeItems(photo, place, previous, next);
    this.shown = { photo, place, previous, next, items };
    return items;
  }

  /**
   * Places a submenu that has opened beside its item again, once the item is where it stays: after the submenu's first
   * render, and once the menu that holds the item has grown.
   * TL;DR: Angular Material places a submenu once, beside its item as the item is when the submenu opens, and leaves it
   * there. A submenu that opened while its menu still grew stayed where its item was then: in the e2e case of Arabic on
   * macOS CI, 11.5 px into its menu, as the menu was at 92.7% of its width (run 45113405487).
   * Details:
   * - A menu grows from 80% of its size as it opens, for 120 ms, from its corner at what opened it, and its items with
   *   it. The CDK places a submenu against its item's box as the box is (MatMenuTrigger._openMenu(),
   *   FlexibleConnectedPositionStrategy.apply()). It places an open menu again only when the page scrolls, when the
   *   window is resized, or when the menu's own items change: not when the menu that holds the item has grown. A
   *   submenu that opens while the menu grows is off by up to a fifth of the item's distance from that corner: in the
   *   Arabic case, at the item's right, where the submenu opens as the window has no room for it on the left.
   * - A submenu that opens again while it fades out, within about 125 ms of closing, is not placed at all: its overlay
   *   is still attached, so it stays where it opened last (MatMenuTrigger._openMenu() attaches it only when it is not).
   *   updatePosition() places it anew then, as opening it again discarded the position that the CDK had chosen for it
   *   (FlexibleConnectedPositionStrategy.withPositions()).
   * - Reproduced in the Arabic case: the arrow towards the submenu as soon as the menu was placed put the submenu at
   *   255.7 px, against its item at 80%; 128 ms after the click, at 283.2 px; once the menu had grown, at 287.3 px.
   *   A person can open a submenu so with the keyboard: Enter on the button, then the arrow within about 0.1 s.
   * - Not found: what opened the submenu that early in run 45113405487. The case presses the arrow once Playwright's
   *   box of the menu, which includes its growth, is as wide as the menu: in 301 runs recorded frame by frame, 241 of
   *   them on macOS CI, the arrow came 5 to 352 ms after the menu had grown, with no scroll, resize or pointer over the
   *   menus in between.
   * - Rejected: a menu that does not grow, which every menu of Angular Material does; a submenu that opens only once its
   *   menu has grown, which would leave the arrow without an answer for up to 0.1 s.
   */
  protected placeAgainOnceShown(trigger: MatMenuTrigger): void {
    afterNextRender(() => {
      const menuPanel = this.document.getElementById(this.menu().panelId);
      // The growth of a menu that closes before it has grown ends without finishing, which rejects. jsdom, where the unit
      // tests run, has no getAnimations(), as Angular finds before it uses it.
      Promise.all((menuPanel?.getAnimations?.() ?? []).map(animation => animation.finished))
        .catch(() => undefined)
        .then(() => {
          if (trigger.menuOpen)
            trigger.updatePosition();
        });
    }, { injector: this.injector });
  }

  private makeItems(photo: Photo, place: PhotoInfoViewerPlace, previous: string | null, next: string | null): MoreOptionsMenuItem[] {
    const items: MoreOptionsMenuItem[] = [];
    if (photo.hasGpsInfo) {
      items.push({ textKey: 'photoInfo.menu.selection', submenu: { name: 'selection', items: [
        { textKey: 'photoInfo.menu.selectOnlyThis', choose: () => this.selectOnlyThis(photo) },
        {
          textKey: 'photoInfo.menu.selectPrevious', disabled: previous === null, shortcut: this.shortcut(selectPreviousShortcut),
          choose: chosenWith => this.selectPrevious(photo, previous, chosenWith),
        },
        {
          textKey: 'photoInfo.menu.selectNext', disabled: next === null, shortcut: this.shortcut(selectNextShortcut),
          choose: chosenWith => this.selectNext(photo, next, chosenWith),
        },
      ] } });
    }
    if (place === 'dir-tree-view' && photo.hasGpsInfo)
      items.push({ textKey: 'photoInfo.menu.revealInMap', choose: () => this.revealInMap(photo) });
    if (place === 'leaflet-map-popup')
      items.push({ textKey: 'photoInfo.menu.revealInSidebar', choose: () => this.revealInSidebar(photo) });
    items.push({ textKey: 'photoInfo.menu.openFolder', choose: () => this.openFolder(photo) });
    if (photo.hasGpsInfo) {
      items.push({ textKey: 'photoInfo.menu.google', submenu: { name: 'google', items: [
        // In the order of Photo Data Viewer's buttons beside the latitude and the longitude.
        { textKey: 'photoInfo.menu.openGoogleMaps', choose: () => this.openGoogleMaps(photo) },
        { textKey: 'photoInfo.menu.openGoogleEarth', choose: () => this.openGoogleEarth(photo) },
        { textKey: 'photoInfo.menu.openGoogleStreetView', choose: () => this.openGoogleStreetView(photo) },
      ] } });
    }
    items.push({ textKey: 'photoInfo.menu.viewData', choose: () => this.viewData(photo) });
    return items;
  }

  private selectOnlyThis(photo: Photo): void {
    logger.info(`Clicked "Only This" menu item for ${photo.path}`);
    // Named as the item was before it moved under Select, which the analytics have counted it by.
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Select Only This"');
    this.directoryTreeViewSelectionService.select([photo.path]);
  }

  private selectPrevious(photo: Photo, previous: string | null, chosenWith: ChosenWith): void {
    if (previous === null)
      return;
    logger.info(`${chosenWithInLog[chosenWith]} "Photo Taken Before" menu item for ${photo.path}, which selects ${previous}`);
    Analytics.trackEvent('Photo Info Viewer', `[PIV] ${chosenWithInAnalytics[chosenWith]} "Photo Taken Before"`);
    this.selectPreviousNextService.select(previous);
  }

  private selectNext(photo: Photo, next: string | null, chosenWith: ChosenWith): void {
    if (next === null)
      return;
    logger.info(`${chosenWithInLog[chosenWith]} "Photo Taken After" menu item for ${photo.path}, which selects ${next}`);
    Analytics.trackEvent('Photo Info Viewer', `[PIV] ${chosenWithInAnalytics[chosenWith]} "Photo Taken After"`);
    this.selectPreviousNextService.select(next);
  }

  /** An item's shortcut, as it is shown on this platform. */
  private shortcut(shortcut: Shortcut): MoreOptionsMenuShortcut {
    return { shortcut, text: shortcutText(shortcut, this.platform), ariaKeyShortcuts: ariaKeyShortcutsOf(shortcut, this.platform) };
  }

  private revealInMap(photo: Photo): void {
    logger.info(`Clicked "Reveal in Map" menu item for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Reveal in Map"');
    this.photoRevealService.revealInMap(photo);
  }

  private revealInSidebar(photo: Photo): void {
    logger.info(`Clicked "Reveal in Sidebar" menu item for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Reveal in Sidebar"');
    this.photoRevealService.revealInSidebar(photo);
  }

  private openFolder(photo: Photo): void {
    logger.info(`Clicked "Open Folder" menu item for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Open Folder"');
    openContainingFolder(photo.path);
  }

  private openGoogleMaps(photo: Photo): void {
    logger.info(`Clicked "Open Google Maps" menu item for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Open Google Maps"');
    const { latitude, longitude } = photo.exif.gpsInfo.latLng;
    const zoom = 14;
    openUrl(`https://maps.google.com/?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=${zoom}`,
            '"Open Google Maps" Menu Item',
            'Photo Info Viewer',
            'https://maps.google.com/ with query parameters for latitude, longitude, and zoom');
  }

  /**
   * Google Earth searches for the latitude and the longitude: it goes to the place and marks it with a pin. The address
   * is that of Photo Data Viewer's Google Earth button (src/components/photo-data/row/LatLngRow.tsx of
   * https://github.com/TomoyukiAota/photo-data-viewer), so that both open the same view.
   */
  private openGoogleEarth(photo: Photo): void {
    logger.info(`Clicked "Open Google Earth" menu item for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Open Google Earth"');
    const { latitude, longitude } = photo.exif.gpsInfo.latLng;
    openUrl(`https://earth.google.com/web/search/${latitude},${longitude}`,
            '"Open Google Earth" Menu Item',
            'Photo Info Viewer',
            'https://earth.google.com/web/search/ with latitude and longitude');
  }

  private openGoogleStreetView(photo: Photo): void {
    logger.info(`Clicked "Open Google Street View" menu item for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Open Google Street View"');
    const { latitude, longitude } = photo.exif.gpsInfo.latLng;
    openUrl(`https://www.google.com/maps/@?api=1&map_action=pano&parameters&viewpoint=${latitude},${longitude}`,
            '"Open Google Street View" Menu Item',
            'Photo Info Viewer',
            'https://www.google.com/maps/ with query parameters for latitude, longitude');
  }

  private viewData(photo: Photo): void {
    logger.info(`Clicked "View Data" menu item for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "View Data"');
    requestMainProcessToLaunchPhotoDataViewer(photo);
  }
}
