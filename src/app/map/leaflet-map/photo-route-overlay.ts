import type {} from '@geoman-io/leaflet-geoman-free';
import type { Bounds, LatLng, Map as LeafletMap, PathOptions, Point } from 'leaflet';
import type { Photo } from '../../shared/model/photo.model';
import { photoRouteParts, type RoutePoint } from './photo-route-parts';

declare const L: typeof import('leaflet');

const color = '#19469f';
const pathOptions: PathOptions = {
  interactive: false,
  pmIgnore: true,
  snapIgnore: true,
  lineCap: 'round',
  lineJoin: 'round',
};
const dashArray = '7 7';
const arrowSpacing = 155;
const minimumPartLength = 52;
const arrowViewportPadding = 16;

/** Chevron points in projected pixels, spaced along the route before clipping it to the view. */
export function photoRouteArrowheads(points: readonly Point[], bounds: Bounds): Point[][] {
  const distances = [0];
  for (let index = 1; index < points.length; index++)
    distances.push(distances[index - 1] + points[index - 1].distanceTo(points[index]));

  const total = distances.at(-1);
  if (total < minimumPartLength)
    return [];

  const count = Math.max(1, Math.round(total / arrowSpacing));
  const step = total / (count + 1);
  const heads: Point[][] = [];
  let nextArrow = 1;
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1];
    const to = points[index];
    const startDistance = distances[index - 1];
    const length = distances[index] - startDistance;
    if (length === 0)
      continue;

    const visible = L.LineUtil.clipSegment(from, to, bounds);
    if (!visible)
      continue;

    const first = Math.max(nextArrow, Math.ceil((startDistance + from.distanceTo(visible[0])) / step));
    const last = Math.min(count, Math.floor((startDistance + from.distanceTo(visible[1])) / step));
    const direction = to.subtract(from).divideBy(length);
    const wing = L.point(-direction.y, direction.x).multiplyBy(6);
    for (let arrow = first; arrow <= last; arrow++) {
      const tip = from.add(direction.multiplyBy(arrow * step - startDistance + 5));
      const back = tip.subtract(direction.multiplyBy(12));
      heads.push([back.add(wing), tip, back.subtract(wing)]);
      nextArrow = arrow + 1;
    }
  }
  return heads;
}

/** The optional line through the pinned photos. The Layers control owns whether it is on the map. */
export class PhotoRouteOverlay {
  private readonly lineHalo = L.polyline([], { ...pathOptions, dashArray, color: 'white', weight: 7 });
  private readonly line = L.polyline([], {
    ...pathOptions, dashArray, color, weight: 3.5, className: 'plm-photo-route-line',
  });
  private readonly arrowHalo = L.polyline([], { ...pathOptions, color: 'white', weight: 7.5 });
  private readonly arrows = L.polyline([], { ...pathOptions, color, weight: 4, className: 'plm-photo-route-arrows' });
  public readonly layer = L.layerGroup([this.lineHalo, this.line, this.arrowHalo, this.arrows], { pmIgnore: true });

  private photos: readonly Photo[] = [];
  private parts: RoutePoint[][] = [];

  constructor(private readonly map: LeafletMap) {
    this.layer.on('add', () => {
      this.updateRoute();
      this.map.on('moveend resize', this.updateArrowheads);
    });
    this.layer.on('remove', () => {
      this.map.off('moveend resize', this.updateArrowheads);
      this.parts = [];
      this.lineHalo.setLatLngs([]);
      this.line.setLatLngs([]);
      this.arrowHalo.setLatLngs([]);
      this.arrows.setLatLngs([]);
    });
  }

  /** Called with the same photos that have just been pinned, including while the overlay is off. */
  public setPhotos(photos: readonly Photo[]): void {
    this.photos = photos;
    if (this.map.hasLayer(this.layer))
      this.updateRoute();
  }

  private updateRoute(): void {
    this.parts = photoRouteParts(this.photos);
    this.lineHalo.setLatLngs(this.parts);
    this.line.setLatLngs(this.parts);
    this.updateArrowheads();
  }

  private readonly updateArrowheads = (): void => {
    const view = this.map.getPixelBounds();
    const padding = L.point(arrowViewportPadding, arrowViewportPadding);
    const bounds = L.bounds(view.min.subtract(padding), view.max.add(padding));
    const heads: LatLng[][] = [];
    for (const part of this.parts) {
      const points = part.map(point => this.map.project(point));
      for (const head of photoRouteArrowheads(points, bounds))
        heads.push(head.map(pixel => this.map.unproject(pixel)));
    }
    this.arrowHalo.setLatLngs(heads);
    this.arrows.setLatLngs(heads);
  };
}
