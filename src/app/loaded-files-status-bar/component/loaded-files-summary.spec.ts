import { Exif } from '../../shared/model/exif.model';
import { GpsInfo } from '../../shared/model/gps-info.model';
import { Photo } from '../../shared/model/photo.model';
import { summarizeLoadedFiles } from './loaded-files-summary';

/** A photo of the given file name in /photos, with location data when withLocation is true. */
function photo(name: string, withLocation = false): Photo {
  const exif = withLocation ? Object.assign(new Exif(), { gpsInfo: new GpsInfo() }) : null;
  const filenameExtension = name.slice(name.lastIndexOf('.')).toLowerCase();
  return Object.assign(new Photo(), { name, path: `/photos/${name}`, filenameExtension, exif });
}

describe('summarizeLoadedFiles', () => {
  it('counts the files, those with location data, and each file type the folder has', () => {
    const summary = summarizeLoadedFiles([photo('a.jpg', true), photo('b.jpeg'), photo('c.heic', true), photo('d.png'), photo('e.mov')]);

    expect(summary).toEqual({
      numberOfLoadedFiles: 5,
      numberOfFilesWithGpsInfo: 2,
      descriptionByFileType: 'JPEG: 2 / HEIF: 1 / PNG: 1 / Total: 5',
    });
  });

  it('leaves out the file types the folder does not have, and the total when there are no files', () => {
    expect(summarizeLoadedFiles([photo('a.tif')]).descriptionByFileType).toBe('TIFF: 1 / Total: 1');
    expect(summarizeLoadedFiles([])).toEqual({ numberOfLoadedFiles: 0, numberOfFilesWithGpsInfo: 0, descriptionByFileType: '' });
  });
});
