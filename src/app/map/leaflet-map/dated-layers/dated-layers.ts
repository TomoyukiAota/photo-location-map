import { ComponentRef } from '@angular/core';
import debounce from 'lodash-es/debounce.js';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import { Photo } from '../../../shared/model/photo.model';
import { LeafletContentService } from '../leaflet-content.service';
import { leafletMapLogger as logger } from '../leaflet-map-logger';
import { MapDateService } from './map-date.service';
import { MapDateChoice, MapDateComponent, MapDateStatus, MapDateView } from './map-date/map-date.component';
import { nearestVersion, PhotoDates, photoDatesOf, versionsNearDate } from './photo-dates';
import { distinctVersions, versionShownIn, WaybackRelease, WaybackVersion } from './wayback';

// Leaflet and its plugins are the global L of angular.json's scripts.
declare let L: any;

/**
 * The layer's name in the map's list of layers: its product's name, as those of the other layers are.
 * It is also the layer's identifier, by which the list of base layers that the app downloads hides it
 * (hiddenBuiltInBaseLayersOf()). A layer that is renamed keeps its old name as its identifier.
 */
export const waybackLayerName = 'Esri World Imagery Wayback';

/** The zoom level from which Wayback's imagery has dates: below it, it is a mosaic without them. */
export const minZoomOfImageryDates = 12;

/**
 * The name of the map's corner that the control is in (corner()). Leaflet adds a control at the end of a corner whose
 * name has no "bottom" in it, as it does in a top corner.
 */
const mapDateCorner = 'plmMapDate';

/** World Imagery as it is now, which the newest release of Wayback shows: until a release is known. */
const currentImageryTile = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const waybackAttribution = 'Tiles &copy; Esri &mdash; World Imagery Wayback &mdash; Source: Esri, Vantor, Maxar, Earthstar Geographics, and the GIS User Community';

/**
 * The layer of the map that shows a past date, Esri World Imagery Wayback, and the control with its date, for one
 * Leaflet map: LeafletMapComponent makes one with its map, and destroys it with the map.
 * TL;DR: While it is the map's base layer, it shows the imagery taken nearest to the dates of the photos on the map, or
 * the imagery that the user chose, and the control says which.
 * Details:
 * - The photos are those on the map that are in its view, or all of those on the map when none is. Wayback shows the
 *   imagery taken nearest to their middle date, from the versions at the map's center at its zoom; its list marks the
 *   versions taken nearest before and after that date (photo-dates.ts). The imagery follows them after each move of
 *   the map, and when other photos are on it (photosChanged()).
 * - A version that the user chooses ends the matching, until they check its box again. What they chose, and what is
 *   shown, are kept in MapDateService.
 * - The list of base layers that the app downloads can hide the layer (hiddenBuiltInBaseLayersOf()).
 * - OpenHistoricalMap, whose map shows a date as its volunteers have drawn it, was a second such layer, and was
 *   removed before any release, as it had little of most places that were looked at. Its code is in the history of
 *   src/app/map/leaflet-map/dated-layers/open-historical-map-layer.ts.
 */
export class DatedLayers {
  /** The layers, by their names, for the map's list of base layers: those that are not hidden. */
  public readonly baseLayers: Readonly<Record<string, unknown>>;
  private readonly wayback: any;
  /** Whether Wayback is the map's base layer, which the control is shown with. */
  private active = false;
  private control: any = null;
  private content: ComponentRef<MapDateComponent> | null = null;
  private status: MapDateStatus = 'ready';
  private releases: readonly WaybackRelease[] = [];
  private versions: readonly WaybackVersion[] = [];
  private photoDates: PhotoDates | null = null;
  /** Counts the refreshes, so that one that a newer one has overtaken does nothing when its answers come. */
  private refreshCount = 0;
  /** Tells MapDateService that the last refresh no longer waits for Wayback's versions at the map's center. */
  private lookup: AbortController | null = null;
  private destroyed = false;
  private lastRecorded = '';

  /** `hiddenLayers` has the names of the layers that are hidden, which the map neither offers nor shows. */
  constructor(private readonly map: any,
              private readonly service: MapDateService,
              private readonly contents: LeafletContentService,
              private readonly photos: () => readonly Photo[],
              layerOptions: Readonly<Record<string, unknown>>,
              hiddenLayers: ReadonlySet<string>) {
    const shownRelease = service.shownRelease();
    this.wayback = L.tileLayer(shownRelease === null ? currentImageryTile : this.waybackTile(shownRelease), {
      ...layerOptions,
      attribution: waybackAttribution,
    });
    const layers = {
      [waybackLayerName]: this.wayback,
    };
    // A hidden layer is made all the same: a layer asks its server for nothing until it is shown.
    this.baseLayers = Object.fromEntries(Object.entries(layers).filter(([name]) => !hiddenLayers.has(name)));
    map.on('moveend', this.refreshAfterMove);
  }

  /** The map's base layer is now `layer`: Wayback, with the control, or another one, without it. */
  public baseLayerChanged(layer: unknown): void {
    this.active = layer === this.wayback;
    this.versions = [];
    if (!this.active) {
      this.stopLookup();
      this.hideControl();
      return;
    }
    this.showControl();
    this.refresh();
  }

  /** Other photos are on the map: the date follows theirs, as after a move of the map, which their render may not make. */
  public photosChanged(): void {
    this.refreshAfterMove();
  }

  /** Stops what is still to come, with the map that is removed. */
  public destroy(): void {
    this.destroyed = true;
    this.refreshAfterMove.cancel();
    this.stopLookup();
  }

  private readonly refreshAfterMove = debounce(() => this.refresh(), 400);

  private async refresh(): Promise<void> {
    if (this.destroyed || !this.active)
      return;
    const count = ++this.refreshCount;
    this.photoDates = this.photoDatesOnMap();
    const zoom = Math.round(this.map.getZoom());
    this.status = 'loading';
    this.render();
    const lookup = new AbortController();
    try {
      const center = this.map.getCenter();
      const versionsAtCenter = zoom < minZoomOfImageryDates ? Promise.resolve(null)
        : this.service.waybackVersionsAt(center.lat, center.lng, zoom, lookup.signal);
      // The last refresh's wait ends once this one waits: the place shown before may be this one, whose versions then go
      // on loading.
      this.stopLookup();
      this.lookup = lookup;
      const [releases, versions] = await Promise.all([this.service.waybackReleases(), versionsAtCenter]);
      if (count !== this.refreshCount || this.destroyed)
        return;
      this.releases = releases;
      if (!versions) {
        // Zoomed out, where the imagery has no dates: the release shown stays, and the control names it.
        this.versions = [];
        this.status = 'zoomIn';
        this.render();
        return;
      }
      this.versions = versions;
      this.status = 'ready';
      const matched = this.service.matchPhotoDates() && this.photoDates ? nearestVersion(versions, this.photoDates.middle) : undefined;
      const release = matched?.release ?? this.service.chosenReleaseOf(releases);
      this.showRelease(release.number);
      const shown = versionShownIn(versions, release);
      this.record(`Layer: "${waybackLayerName}", Release: ${release.date} (${release.number}), Captured: ${shown?.captureDate}, `
        + `Matched to Photos: ${!!matched}`);
    } catch (error) {
      // Overtaken, or stopped, as when the map shows another layer.
      if (count !== this.refreshCount || this.destroyed || lookup.signal.aborted)
        return;
      this.status = 'failed';
      logger.errorNotRecorded(`Failed to load the dates of ${waybackLayerName}`, error);
      Analytics.trackEvent('Leaflet Map', '[Leaflet Map] Failed to Load Map Dates', `Layer: "${waybackLayerName}", Error: ${error?.message ?? error}`);
    }
    this.render();
  }

  /** Tells MapDateService that the last refresh no longer waits for Wayback's versions, which it stops if none does. */
  private stopLookup(): void {
    this.lookup?.abort();
    this.lookup = null;
  }

  /** The dates of the photos on the map that are in its view, or of all those on the map when none is. */
  private photoDatesOnMap(): PhotoDates | null {
    const dated = this.photos().filter(photo => photo.exif?.dateTimeOriginal && photo.exif?.gpsInfo);
    const bounds = this.map.getBounds?.();
    const inView = bounds ? dated.filter(photo => bounds.contains([photo.exif.gpsInfo.latLng.latitude, photo.exif.gpsInfo.latLng.longitude])) : [];
    return photoDatesOf((inView.length > 0 ? inView : dated).map(photo => photo.exif.dateTimeOriginal.moment));
  }

  private waybackTile(release: number): string {
    return waybackUrls.tile.replace('{release}', String(release));
  }

  private showRelease(release: number): void {
    if (this.service.shownRelease() === release && this.wayback._url !== currentImageryTile)
      return;
    this.service.shownRelease.set(release);
    this.wayback.setUrl(this.waybackTile(release));
  }

  //#region --- The control ---
  private showControl(): void {
    if (this.control)
      return;
    const content = this.contents.create(MapDateComponent, { view: this.view() });
    content.instance.earlier.subscribe(() => this.step(+1));
    content.instance.later.subscribe(() => this.step(-1));
    content.instance.choose.subscribe(release => this.choose(release));
    content.instance.matchPhotoDatesChange.subscribe(match => this.setMatchPhotoDates(match));
    const element: HTMLElement = content.location.nativeElement;
    const Control = L.Control.extend({
      onAdd: () => {
        const box = L.DomUtil.create('div', 'leaflet-bar plm-leaflet-map-date');
        L.DomEvent.disableClickPropagation(box);
        L.DomEvent.disableScrollPropagation(box);
        box.appendChild(element);
        return box;
      },
    });
    this.content = content;
    this.control = new Control({ position: this.corner() }).addTo(this.map);
  }

  /**
   * The corner of the map that the control is in, which Leaflet does not have: at the top, beside the layers button.
   * TL;DR: So that the box does not cover the buttons that draw a region, at the bottom right, however short the map is.
   * Details:
   * - In the top right corner, below the layers button, the box covered the top of Leaflet-Geoman's toolbar in a map
   *   shorter than about 520px in English, and 560px in the languages with longer sentences: in every language at the
   *   window's default size. Beside the layers button, the box is apart from the toolbar's column.
   * - The corner is below the other ones (_plm-leaflet-map-date.scss): a tool's actions, which open to the left of its
   *   button, are above the box, and so is the list of the layers, which opens over the box without moving it.
   * - Leaflet has no method that adds a corner. The map keeps its corners in _controlCorners, where its own
   *   _initControlPos() puts them, and its remove() takes every one of them away, this one too.
   */
  private corner(): string {
    if (!this.map._controlCorners[mapDateCorner])
      this.map._controlCorners[mapDateCorner] = L.DomUtil.create('div', 'leaflet-top leaflet-right plm-leaflet-map-date-corner', this.map._controlContainer);
    return mapDateCorner;
  }

  private hideControl(): void {
    this.control?.remove();
    this.control = null;
    this.content?.destroy();
    this.content = null;
  }

  private render(): void {
    this.content?.setInput('view', this.view());
  }

  private view(): MapDateView {
    const choices = this.choices();
    const shown = this.shownChoice(choices);
    const index = choices.indexOf(shown);
    // Without dates to choose from, as when the map is zoomed out, the release shown, by its date: the newest until one
    // is chosen or matched, as World Imagery shows it now.
    const shownNumber = this.service.shownRelease();
    const shownRelease = shownNumber === null ? this.releases[0] : this.releases.find(release => release.number === shownNumber);
    return {
      status: this.status,
      choices,
      chosenRelease: shown?.release ?? null,
      date: choices.length === 0 ? shownRelease?.date ?? null : null,
      photoDates: this.photoDates,
      matchPhotoDates: this.service.matchPhotoDates(),
      canGoEarlier: index >= 0 && index < choices.length - 1,
      canGoLater: index > 0,
    };
  }

  private choices(): MapDateChoice[] {
    const versions = distinctVersions(this.versions);
    const near = this.photoDates ? versionsNearDate(versions, this.photoDates.middle) : new Set<WaybackVersion>();
    return versions.map(version => ({
      release: version.release.number,
      captureDate: version.captureDate,
      releaseDate: version.release.date,
      nearPhotos: near.has(version),
    }));
  }

  /**
   * The choice of the imagery that the map shows: the version that the shown release shows here, or the choice of the
   * same date, as the list has one version for each date (distinctVersions()).
   */
  private shownChoice(choices: readonly MapDateChoice[]): MapDateChoice | undefined {
    const shownRelease = this.releases.find(release => release.number === this.service.shownRelease());
    const version = shownRelease ? versionShownIn(this.versions, shownRelease) : undefined;
    if (!version)
      return undefined;
    return choices.find(choice => choice.release === version.release.number)
      ?? choices.find(choice => choice.captureDate !== null && choice.captureDate === version.captureDate);
  }

  /** One version older (+1) or newer (-1) in Wayback's list. */
  private step(direction: 1 | -1): void {
    const choices = this.choices();
    const next = choices[choices.indexOf(this.shownChoice(choices)) + direction];
    if (next)
      this.choose(next.release);
  }

  private choose(release: number): void {
    this.service.matchPhotoDates.set(false);
    this.service.chosenRelease.set(release);
    this.refresh();
  }

  private setMatchPhotoDates(match: boolean): void {
    this.service.matchPhotoDates.set(match);
    Analytics.trackEvent('Leaflet Map', '[Leaflet Map] Changed Matching of Map Date', `Layer: "${waybackLayerName}", Match Photo Dates: ${match}`);
    this.refresh();
  }
  //#endregion --- The control ---

  /** Records the date shown, once for each date. */
  private record(description: string): void {
    if (description === this.lastRecorded)
      return;
    this.lastRecorded = description;
    logger.info(`Map date: ${description}`);
    Analytics.trackEvent('Leaflet Map', '[Leaflet Map] Changed Map Date', description);
  }
}
