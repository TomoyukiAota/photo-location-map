import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaybackDateStoreDouble } from '../../../../test/angular/wayback-date-store-double';
import { openWaybackDateStore } from '../../map/leaflet-map/dated-layers/wayback-date-cache';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { CacheTabComponent } from './cache-tab.component';

describe('CacheTabComponent', () => {
  let store: WaybackDateStoreDouble;
  let fixture: ComponentFixture<CacheTabComponent>;
  let element: HTMLElement;

  const text = (selector: string) => element.querySelector(selector)?.textContent.trim();
  const button = (selector: string) => element.querySelector<HTMLButtonElement>(selector);
  /** Waits until `check` passes on the page as it is rendered. */
  const rendered = (check: () => void) => vi.waitFor(async () => {
    await fixture.whenStable();
    check();
  });

  beforeEach(async () => {
    // Three places in the map's cache.
    store = new WaybackDateStoreDouble();
    for (const key of ['16/1/1', '16/1/2', '17/2/2'])
      store.places.set(key, { key, newestRelease: 3692, versions: [], seenAt: 1 });
    TestBed.configureTestingModule({ providers: [{ provide: openWaybackDateStore, useValue: async () => store }] });
    fixture = TestBed.createComponent(CacheTabComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('opens the Thumbnails tab, where the cache of the thumbnails is', () => {
    const opened: string[] = [];
    fixture.componentInstance.openThumbnailsTab.subscribe(() => opened.push('thumbnails'));

    button('.cache-tab-link').click();

    expect(text('.cache-tab-link')).toBe('Open the Thumbnails Tab');
    expect(opened).toEqual(['thumbnails']);
  });

  it('counts the places that the map\'s cache keeps, and deletes them without a restart', async () => {
    const deleteAndRestart = vi.spyOn(window.plm.thumbnailCache, 'deleteAndRestart');
    await rendered(() => expect(text('.cache-tab-map-count')).toBe('Places cached: 3'));
    // Its most, as English writes numbers.
    expect(element.textContent).toContain('for up to 100,000 places looked at on the map');

    button('.cache-tab-delete-map').click();

    await rendered(() => expect(text('.cache-tab-map-count')).toBe('Places cached: 0'));
    expect(store.places.size).toBe(0);
    expect(button('.cache-tab-delete-map').disabled).toBe(true);
    expect(deleteAndRestart).not.toHaveBeenCalled();
  });

  it('deletes all caches once the user confirms only, the map\'s first, then the thumbnails\' with a restart', async () => {
    const deleteAndRestart = vi.spyOn(window.plm.thumbnailCache, 'deleteAndRestart');
    const confirm = vi.spyOn(TestBed.inject(ConfirmDialogService), 'confirm').mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await fixture.componentInstance.deleteAllCaches();
    expect(store.places.size).toBe(3);
    expect(deleteAndRestart).not.toHaveBeenCalled();
    await fixture.componentInstance.deleteAllCaches();

    expect(store.places.size).toBe(0);
    expect(deleteAndRestart).toHaveBeenCalledExactlyOnceWith();
    expect(confirm).toHaveBeenCalledWith('This application will restart after deleting all caches.\nDo you want to continue?');
  });
});
