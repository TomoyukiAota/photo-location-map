import { ComponentRef } from '@angular/core';
import debounce from 'lodash-es/debounce.js';
import moment from 'moment';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import { Photo } from '../../../shared/model/photo.model';
import { LeafletContentService } from '../leaflet-content.service';
import { leafletMapLogger as logger } from '../leaflet-map-logger';
import { MapDateService } from './map-date.service';
import { MapDateChoice, MapDateComponent, MapDateKind, MapDateStatus, MapDateView } from './map-date/map-date.component';
import { openHistoricalMapLayer } from './open-historical-map-layer';
import { nearestVersion, PhotoDates, photoDatesOf, versionsNearDate } from './photo-dates';
import { distinctVersions, versionShownIn, WaybackRelease, WaybackVersion } from './wayback';

// Leaflet and its plugins are the global L of angular.json's scripts.
declare let L: any;

/**
 * The layers' names in the map's list of layers: their products' names, as those of the other layers are.
 * They are also the layers' identifiers, by which the list of base layers that the app downloads hides them
 * (hiddenBuiltInBaseLayersOf()). A layer that is renamed keeps its old name as its identifier.
 */
export const waybackLayerName = 'Esri World Imagery Wayback';
export const openHistoricalMapLayerName = 'OpenHistoricalMap';

/** The zoom level from which Wayback's imagery has dates: below it, it is a mosaic without them. */
export const minZoomOfImageryDates = 12;

/** World Imagery as it is now, which the newest release of Wayback shows: until a release is known. */
const currentImageryTile = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const waybackAttribution = 'Tiles &copy; Esri &mdash; World Imagery Wayback &mdash; Source: Esri, Vantor, Maxar, Earthstar Geographics, and the GIS User Community';
const openHistoricalMapAttribution = 'OpenHistoricalMap &mdash; Land cover: &copy; ESA 2010 and UCLouvain';

/**
 * The layers of the map that show a past date, Esri World Imagery Wayback and OpenHistoricalMap, and the control with
 * their date, for one Leaflet map: LeafletMapComponent makes one with its map, and destroys it with the map.
 * TL;DR: While one of them is the map's base layer, its date follows the dates of the photos on the map, or the date
 * that the user chose, and the control says which.
 * Details:
 * - The photos are those on the map that are in its view, or all of those on the map when none is. Wayback shows the
 *   imagery taken nearest to their middle date, from the versions at the map's center at its zoom; its list marks the
 *   versions taken nearest before and after that date (photo-dates.ts). OpenHistoricalMap shows that very date. The
 *   date follows them after each move of the map, and when other photos are on it (photosChanged()).
 * - A date that the user chooses ends the matching, until they check its box again. What they chose, and what is
 *   shown, are kept in MapDateService.
 * - The list of base layers that the app downloads can hide either layer (hiddenBuiltInBaseLayersOf()).
 */
export class DatedLayers {
  /** The layers, by their names, for the map's list of base layers: those that are not hidden. */
  public readonly baseLayers: Readonly<Record<string, unknown>>;
  private readonly wayback: any;
  private readonly openHistoricalMap: any;
  private kind: MapDateKind | null = null;
  private control: any = null;
  private content: ComponentRef<MapDateComponent> | null = null;
  private status: MapDateStatus = 'ready';
  private releases: readonly WaybackRelease[] = [];
  private versions: readonly WaybackVersion[] = [];
  private photoDates: PhotoDates | null = null;
  private openHistoricalMapFailed = false;
  /** Counts the refreshes, so that one that a newer one has overtaken does nothing when its answers come. */
  private refreshCount = 0;
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
    this.photoDates = this.photoDatesOnMap();
    this.openHistoricalMap = openHistoricalMapLayer({
      date: this.openHistoricalMapDate(),
      attribution: openHistoricalMapAttribution,
      maxZoom: Number(layerOptions['maxZoom']),
      onError: error => this.onOpenHistoricalMapError(error),
    });
    const layers = {
      [waybackLayerName]: this.wayback,
      [openHistoricalMapLayerName]: this.openHistoricalMap,
    };
    // A hidden layer is made all the same: a layer asks its server for nothing until it is shown.
    this.baseLayers = Object.fromEntries(Object.entries(layers).filter(([name]) => !hiddenLayers.has(name)));
    map.on('moveend', this.refreshAfterMove);
  }

  /** The map's base layer is now `layer`: one of these, with the control, or another one, without it. */
  public baseLayerChanged(layer: unknown): void {
    this.kind = layer === this.wayback ? 'wayback' : layer === this.openHistoricalMap ? 'openHistoricalMap' : null;
    this.versions = [];
    if (!this.kind) {
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
  }

  private readonly refreshAfterMove = debounce(() => this.refresh(), 400);

  private async refresh(): Promise<void> {
    if (this.destroyed || !this.kind)
      return;
    const count = ++this.refreshCount;
    this.photoDates = this.photoDatesOnMap();
    if (this.kind === 'openHistoricalMap') {
      this.status = this.openHistoricalMapFailed ? 'mapFailed' : 'ready';
      const date = this.openHistoricalMapDate();
      this.openHistoricalMap.setDate(date);
      this.render();
      this.record(`Layer: "${openHistoricalMapLayerName}", Date: ${date}, Matched to Photos: ${this.matchPhotoDates('openHistoricalMap')}`);
      return;
    }

    const zoom = Math.round(this.map.getZoom());
    this.status = 'loading';
    this.render();
    try {
      const center = this.map.getCenter();
      const [releases, versions] = await Promise.all([
        this.service.waybackReleases(),
        zoom < minZoomOfImageryDates ? Promise.resolve(null) : this.service.waybackVersionsAt(center.lat, center.lng, zoom),
      ]);
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
      const matched = this.matchPhotoDates('wayback') && this.photoDates ? nearestVersion(versions, this.photoDates.middle) : undefined;
      const release = matched?.release ?? this.service.chosenReleaseOf(releases);
      this.showRelease(release.number);
      const shown = versionShownIn(versions, release);
      this.record(`Layer: "${waybackLayerName}", Release: ${release.date} (${release.number}), Captured: ${shown?.captureDate}, `
        + `Matched to Photos: ${!!matched}`);
    } catch (error) {
      if (count !== this.refreshCount || this.destroyed)
        return;
      this.status = 'failed';
      logger.errorNotRecorded(`Failed to load the dates of ${waybackLayerName}`, error);
      Analytics.trackEvent('Leaflet Map', '[Leaflet Map] Failed to Load Map Dates', `Layer: "${waybackLayerName}", Error: ${error?.message ?? error}`);
    }
    this.render();
  }

  /** The dates of the photos on the map that are in its view, or of all those on the map when none is. */
  private photoDatesOnMap(): PhotoDates | null {
    const dated = this.photos().filter(photo => photo.exif?.dateTimeOriginal && photo.exif?.gpsInfo);
    const bounds = this.map.getBounds?.();
    const inView = bounds ? dated.filter(photo => bounds.contains([photo.exif.gpsInfo.latLng.latitude, photo.exif.gpsInfo.latLng.longitude])) : [];
    return photoDatesOf((inView.length > 0 ? inView : dated).map(photo => photo.exif.dateTimeOriginal.moment));
  }

  private openHistoricalMapDate(): string {
    return this.matchPhotoDates('openHistoricalMap') && this.photoDates ? this.photoDates.middle : this.service.chosenDate();
  }

  private matchPhotoDates(kind: MapDateKind): boolean {
    return this.service.matchPhotoDates[kind]();
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
    content.instance.pick.subscribe(date => this.pickDate(date));
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
    this.control = new Control({ position: 'topright' }).addTo(this.map);
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
    const common = {
      status: this.status,
      photoDates: this.photoDates,
      matchPhotoDates: this.kind ? this.matchPhotoDates(this.kind) : false,
    };
    if (this.kind !== 'wayback') {
      const date = this.openHistoricalMapDate();
      return { ...common, kind: 'openHistoricalMap', choices: [], chosenRelease: null, date,
        canGoEarlier: true, canGoLater: date < moment().format('YYYY-MM-DD') };
    }
    const choices = this.choices();
    const shown = this.shownChoice(choices);
    const index = choices.indexOf(shown);
    // Without dates to choose from, as when the map is zoomed out, the release shown, by its date: the newest until one
    // is chosen or matched, as World Imagery shows it now.
    const shownNumber = this.service.shownRelease();
    const shownRelease = shownNumber === null ? this.releases[0] : this.releases.find(release => release.number === shownNumber);
    return {
      ...common,
      kind: 'wayback',
      choices,
      chosenRelease: shown?.release ?? null,
      date: choices.length === 0 ? shownRelease?.date ?? null : null,
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

  /** One version older (+1) or newer (-1) in Wayback's list, or one year earlier or later for OpenHistoricalMap. */
  private step(direction: 1 | -1): void {
    if (this.kind === 'openHistoricalMap') {
      // A year later than today is today.
      const today = moment().format('YYYY-MM-DD');
      const shifted = moment(this.openHistoricalMapDate(), 'YYYY-MM-DD').subtract(direction, 'year').format('YYYY-MM-DD');
      const date = shifted > today ? today : shifted;
      this.service.matchPhotoDates.openHistoricalMap.set(false);
      this.service.chosenDate.set(date);
      this.refresh();
      return;
    }
    const choices = this.choices();
    const next = choices[choices.indexOf(this.shownChoice(choices)) + direction];
    if (next)
      this.choose(next.release);
  }

  /** A date of OpenHistoricalMap chosen in its calendar, which ends the matching of the photos' dates. */
  private pickDate(date: string): void {
    this.service.matchPhotoDates.openHistoricalMap.set(false);
    this.service.chosenDate.set(date);
    this.refresh();
  }

  private choose(release: number): void {
    this.service.matchPhotoDates.wayback.set(false);
    this.service.chosenRelease.set(release);
    this.refresh();
  }

  private setMatchPhotoDates(match: boolean): void {
    if (!this.kind)
      return;
    this.service.matchPhotoDates[this.kind].set(match);
    const name = this.kind === 'wayback' ? waybackLayerName : openHistoricalMapLayerName;
    Analytics.trackEvent('Leaflet Map', '[Leaflet Map] Changed Matching of Map Date', `Layer: "${name}", Match Photo Dates: ${match}`);
    this.refresh();
  }
  //#endregion --- The control ---

  private onOpenHistoricalMapError(error: unknown): void {
    this.openHistoricalMapFailed = true;
    logger.errorNotRecorded(`Failed to show ${openHistoricalMapLayerName}`, error);
    Analytics.trackEvent('Leaflet Map', '[Leaflet Map] Failed to Show Map', `Layer: "${openHistoricalMapLayerName}", Error: ${(error as Error)?.message ?? error}`);
    if (this.kind === 'openHistoricalMap') {
      this.status = 'mapFailed';
      this.render();
    }
  }

  /** Records the date shown, once for each date. */
  private record(description: string): void {
    if (description === this.lastRecorded)
      return;
    this.lastRecorded = description;
    logger.info(`Map date: ${description}`);
    Analytics.trackEvent('Leaflet Map', '[Leaflet Map] Changed Map Date', description);
  }
}
