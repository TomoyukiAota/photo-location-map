import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, Directive, inject, viewChild } from '@angular/core';
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
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

/** An item of the menu, which does what it says, or opens one of the menu's submenus. */
interface MoreOptionsMenuItem {
  readonly textKey: TranslationKey;
  readonly onClick?: () => void;
  /** Select Previous or Select Next for a photo that has no photo before or after it: shown, and not chosen. */
  readonly disabled?: boolean;
  readonly submenu?: {
    readonly name: 'selection' | 'google';
    readonly items: readonly MoreOptionsMenuItem[];
  };
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
 *   menu.
 */
@Component({
  selector: 'app-photo-info-viewer-more-options-menu',
  templateUrl: './more-options-menu.component.html',
  styleUrl: './more-options-menu.component.scss',
  imports: [ClosesOnPressElsewhereDirective, MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger, TranslatePipe],
})
export class MoreOptionsMenuComponent {
  private readonly directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private readonly photoRevealService = inject(PhotoRevealService);
  private readonly selectPreviousNextService = inject(SelectPreviousNextService);

  private readonly menu = viewChild.required<MatMenu>('menu');

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

  private makeItems(photo: Photo, place: PhotoInfoViewerPlace, previous: string | null, next: string | null): MoreOptionsMenuItem[] {
    const items: MoreOptionsMenuItem[] = [];
    if (photo.hasGpsInfo) {
      items.push({ textKey: 'photoInfo.menu.selection', submenu: { name: 'selection', items: [
        { textKey: 'photoInfo.menu.selectOnlyThis', onClick: () => this.selectOnlyThis(photo) },
        { textKey: 'photoInfo.menu.selectPrevious', disabled: previous === null, onClick: () => this.selectPrevious(photo, previous) },
        { textKey: 'photoInfo.menu.selectNext', disabled: next === null, onClick: () => this.selectNext(photo, next) },
      ] } });
    }
    if (place === 'dir-tree-view' && photo.hasGpsInfo)
      items.push({ textKey: 'photoInfo.menu.revealInMap', onClick: () => this.revealInMap(photo) });
    if (place === 'leaflet-map-popup')
      items.push({ textKey: 'photoInfo.menu.revealInSidebar', onClick: () => this.revealInSidebar(photo) });
    items.push({ textKey: 'photoInfo.menu.openFolder', onClick: () => this.openFolder(photo) });
    if (photo.hasGpsInfo) {
      items.push({ textKey: 'photoInfo.menu.google', submenu: { name: 'google', items: [
        // In the order of Photo Data Viewer's buttons beside the latitude and the longitude.
        { textKey: 'photoInfo.menu.openGoogleMaps', onClick: () => this.openGoogleMaps(photo) },
        { textKey: 'photoInfo.menu.openGoogleEarth', onClick: () => this.openGoogleEarth(photo) },
        { textKey: 'photoInfo.menu.openGoogleStreetView', onClick: () => this.openGoogleStreetView(photo) },
      ] } });
    }
    items.push({ textKey: 'photoInfo.menu.viewData', onClick: () => this.viewData(photo) });
    return items;
  }

  private selectOnlyThis(photo: Photo): void {
    logger.info(`Clicked "Only This" menu item for ${photo.path}`);
    // Named as the item was before it moved under Select, which the analytics have counted it by.
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Select Only This"');
    this.directoryTreeViewSelectionService.select([photo.path]);
  }

  private selectPrevious(photo: Photo, previous: string | null): void {
    if (previous === null)
      return;
    logger.info(`Clicked "Photo Taken Before" menu item for ${photo.path}, which selects ${previous}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Photo Taken Before"');
    this.selectPreviousNextService.select(previous);
  }

  private selectNext(photo: Photo, next: string | null): void {
    if (next === null)
      return;
    logger.info(`Clicked "Photo Taken After" menu item for ${photo.path}, which selects ${next}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Photo Taken After"');
    this.selectPreviousNextService.select(next);
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
