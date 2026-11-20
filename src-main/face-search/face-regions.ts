import * as path from 'path';
// The managed reader closes exifr's file handles on every path.
import { managedExifr } from '../../electron-util/managed-exifr.js';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension.js';

/** exifr's options that read a photo's XMP alone, each of its namespaces as an object of its own. */
const xmpOnly = { tiff: false, xmp: true, mergeOutput: false };

/** A value of XMP that holds one item or several, as exifr gives a bag: an object for one, an array for more. */
function itemsOf(value: unknown): Record<string, unknown>[] {
  const items = Array.isArray(value) ? value : [value];
  return items.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
}

/** The object at `keys` in `value`, or undefined where there is none. */
function at(value: unknown, ...keys: string[]): unknown {
  return keys.reduce<unknown>((object, key) => (typeof object === 'object' && object !== null ? object[key] : undefined), value);
}

/**
 * Whether a photo's XMP, as exifr reads it with `xmpOnly`, marks a face.
 * TL;DR: A region of the Metadata Working Group whose type is Face, or a region of Microsoft's People tags.
 * Details:
 * - The Metadata Working Group's regions (mwg-rs:Regions) are what Lightroom, digiKam, Picasa and ExifTool write, and
 *   iPhones, with Apple's own extensions, by ExifTool's documentation. A region of another type, Pet, Focus or
 *   BarCode, marks no face.
 * - Microsoft's People tags (MP:RegionInfo), from Windows Photo Gallery, mark people: each region is a face.
 * - Both are written with or without a name: a face that was found but not named counts too.
 */
export function hasFaceRegionIn(xmp: unknown): boolean {
  const mwgRegions = itemsOf(at(xmp, 'mwg-rs', 'Regions', 'RegionList'));
  if (mwgRegions.some(region => region.Type === 'Face'))
    return true;
  return itemsOf(at(xmp, 'MP', 'RegionInfo', 'Regions')).length > 0;
}

/**
 * Whether the photo's metadata marks a face, which the search for faces then takes as found without looking.
 * TL;DR: JPEG files only, whose XMP exifr reads. False for any other file, and for one that cannot be read.
 * Details: exifr 7.1.3 reads the Exif item of a HEIF file but not its XMP, which is an item of its own (a "mime" item
 * of application/rdf+xml), so a HEIF file's regions are not read: the search looks for faces in it as in any other.
 */
export async function hasFaceRegion(filePath: string): Promise<boolean> {
  if (!FilenameExtension.isJpeg(path.extname(filePath).toLowerCase()))
    return false;
  try {
    return hasFaceRegionIn(await managedExifr.parse(filePath, xmpOnly));
  } catch {
    return false; // The search looks for faces in it as in a photo without regions.
  }
}
