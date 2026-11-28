import { compareByShootingTime, compareNames } from '../../directory-tree-view/dir-tree-view-sort/dir-tree-view-sort-comparison';
import { LatLng } from '../../shared/model/lat-lng.model';
import type { Photo } from '../../shared/model/photo.model';

export type RoutePoint = [latitude: number, longitude: number];

interface RoutePhoto {
  readonly name: string;
  readonly path: string;
  readonly shootingTime: number;
  readonly point: RoutePoint;
}

const antimeridian = 180;
const worldWidth = 2 * antimeridian;
const radiansPerDegree = Math.PI / 180;
const maxMercatorLatitude = 85.0511287798;

/** The line through the pinned photos in EXIF shooting order, split at the edges of Leaflet's world. */
export function photoRouteParts(photos: readonly Photo[]): RoutePoint[][] {
  const datedLocations: RoutePhoto[] = [];
  for (const photo of photos) {
    const shootingTime = photo.exif?.dateTimeOriginal?.moment.valueOf();
    const location = photo.exif?.gpsInfo?.latLng;
    if (!Number.isFinite(shootingTime) || !LatLng.isLocation(location?.latitude, location?.longitude)) continue;
    datedLocations.push({ name: photo.name, path: photo.path, shootingTime, point: [location.latitude, location.longitude] });
  }
  datedLocations.sort((a, b) => compareByShootingTime(a, b) || compareNames(a.path, b.path)
    || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const parts: RoutePoint[][] = [];
  let previous: RoutePoint | undefined;
  for (const { point } of datedLocations) {
    if (previous) appendBetween(parts, previous, point);
    previous = point;
  }
  return parts;
}

function appendBetween(parts: RoutePoint[][], from: RoutePoint, to: RoutePoint): void {
  const longitudeChange = to[1] - from[1];
  if (Math.abs(longitudeChange) <= antimeridian) {
    appendSegment(parts, from, to);
    return;
  }

  // +180 and -180 are the same meridian. A segment along it fits on the starting side.
  if (Math.abs(longitudeChange) === worldWidth) {
    appendSegment(parts, from, [to[0], from[1]]);
    return;
  }

  const edge = longitudeChange < 0 ? antimeridian : -antimeridian;
  const unwrappedLongitude = to[1] + 2 * edge;
  const fraction = (edge - from[1]) / (unwrappedLongitude - from[1]);
  const latitude = crossingLatitude(from[0], to[0], fraction);
  appendSegment(parts, from, [latitude, edge]);
  appendSegment(parts, [latitude, -edge], to);
}

function appendSegment(parts: RoutePoint[][], from: RoutePoint, to: RoutePoint): void {
  if (samePoint(from, to)) return;
  const part = parts.at(-1);
  if (part && samePoint(part.at(-1), from)) {
    part.push(to);
  } else {
    parts.push([from, to]);
  }
}

function samePoint(a: RoutePoint, b: RoutePoint): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Leaflet draws straight lines in Web Mercator. Split at the same projected height on both sides. */
function crossingLatitude(from: number, to: number, fraction: number): number {
  if (fraction === 0 || from === to) return from;
  if (fraction === 1) return to;
  const fromY = mercatorY(from);
  const crossingY = fromY + fraction * (mercatorY(to) - fromY);
  return Math.atan(Math.sinh(crossingY)) / radiansPerDegree;
}

function mercatorY(latitude: number): number {
  const clampedLatitude = Math.min(maxMercatorLatitude, Math.max(-maxMercatorLatitude, latitude));
  return Math.asinh(Math.tan(clampedLatitude * radiansPerDegree));
}
