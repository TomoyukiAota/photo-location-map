// As of Oct 2020, ExifFetcher exists in a subfolder of src folder, which means it is for renderer process.
// In order for unit tests using main process to avoid loading ExifFetcher, the value to determine the library to fetch EXIF is defined here.

export const exifFetchLibraryInUse: 'exifr' | 'exif-parser' = 'exifr';
