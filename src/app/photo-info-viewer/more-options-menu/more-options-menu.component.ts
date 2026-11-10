import { afterNextRender, Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
import { openUrl } from '../../../../src-shared/url/open-url';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { Photo } from '../../shared/model/photo.model';
import { openContainingFolder } from '../../shared/open-with-os';
import { removeFocus } from '../../shared/remove-focus';
import { photoInfoViewerLogger as logger } from '../photo-info-viewer-logger';
import { cutOffAtEdgeOfArea, MoreOptionsMenuPlacement } from './more-options-menu-placement';
import { requestMainProcessToLaunchPhotoDataViewer } from './view-data/request-main-process-to-launch-photo-data-viewer';

interface MoreOptionsMenuItem {
  readonly textKey: TranslationKey;
  readonly onClick: () => void;
}

/**
 * The menu of a photo's More Options button: what else can be done with the photo.
 * TL;DR: The menu is inside its button, which the viewer's template puts it in, and closes when the button loses the
 * focus.
 * Details: A click on an item keeps the focus on the button, as the item is inside it, so the item's click is
 * handled before the menu closes; the item then takes the focus off the button. Were the menu next to the button,
 * pressing the mouse on an item would take the focus, and close the menu before the click.
 */
@Component({
  selector: 'app-photo-info-viewer-more-options-menu',
  template: `
    @for (item of items(); track item.textKey) {
      <div class="photo-info-viewer-more-options-menu-item" (click)="onItemClick($event, item)">{{ item.textKey | t }}</div>
    }
  `,
  styleUrl: './more-options-menu.component.scss',
  imports: [TranslatePipe],
  host: {
    'class': 'photo-info-viewer-more-options-menu',
    '[style.top]': 'placement().top',
    '[style.bottom]': 'placement().bottom',
    '[style.inset-inline-start]': 'placement().insetInlineStart',
    '[style.inset-inline-end.px]': 'insetInlineEnd()',
  },
})
export class MoreOptionsMenuComponent {
  private readonly directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly photo = input.required<Photo>();
  /** Where the menu opens, which the viewer decides from the room around the button (placeMenu()). */
  public readonly placement = input.required<MoreOptionsMenuPlacement>();

  /** How far the menu was beyond the edge of its area when it opened, by which it is moved towards the inside. */
  private readonly cutOff = signal(0);
  protected readonly insetInlineEnd = computed(() => {
    const { insetInlineEnd } = this.placement();
    return insetInlineEnd === null ? null : insetInlineEnd - this.cutOff();
  });

  /** A photo without a location has no item that needs one. */
  protected readonly items = computed<MoreOptionsMenuItem[]>(() => {
    const photo = this.photo();
    const items: MoreOptionsMenuItem[] = [];
    if (photo.hasGpsInfo)
      items.push({ textKey: 'photoInfo.menu.selectOnlyThis', onClick: () => this.selectOnlyThis(photo) });
    items.push({ textKey: 'photoInfo.menu.openFolder', onClick: () => this.openFolder(photo) });
    if (photo.hasGpsInfo) {
      items.push({ textKey: 'photoInfo.menu.openGoogleMaps', onClick: () => this.openGoogleMaps(photo) });
      items.push({ textKey: 'photoInfo.menu.openGoogleStreetView', onClick: () => this.openGoogleStreetView(photo) });
    }
    items.push({ textKey: 'photoInfo.menu.viewData', onClick: () => this.viewData(photo) });
    return items;
  });

  constructor() {
    // The menu is as wide as its longest item, so it is measured once it is in the page, before it is painted.
    afterNextRender({
      read: () => {
        const moreOptionsButton = this.element.parentElement;
        if (moreOptionsButton)
          this.cutOff.set(cutOffAtEdgeOfArea(this.element, moreOptionsButton));
      },
    });
  }

  protected onItemClick(event: MouseEvent, item: MoreOptionsMenuItem): void {
    // Not a click on the button, which would open the menu again.
    event.stopPropagation();
    item.onClick();
    // The button loses the focus, which closes this menu and gives the button back the look that it has without one.
    removeFocus();
  }

  private selectOnlyThis(photo: Photo): void {
    logger.info(`Clicked "Select Only This" menu item for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked "Select Only This"');
    this.directoryTreeViewSelectionService.select([photo.path]);
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
