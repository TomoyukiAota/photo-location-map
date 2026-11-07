import { Photo } from '../../shared/model/photo.model';

export interface LoadedFilesSummary {
  readonly numberOfLoadedFiles: number;
  readonly numberOfFilesWithGpsInfo: number;
  /** Such as "JPEG: 3 / HEIF: 1 / Total: 4": the number of each file type the folder has, then the total. */
  readonly descriptionByFileType: string;
}

/** What the loaded-files status bar shows about the photos of the opened folder. */
export function summarizeLoadedFiles(photos: readonly Photo[]): LoadedFilesSummary {
  const fileTypeAndNumber = new Map<string, number>([
    ['JPEG', photos.filter(photo => photo.isJpeg).length],
    ['HEIF', photos.filter(photo => photo.isHeif).length],
    ['PNG', photos.filter(photo => photo.isPng).length],
    ['TIFF', photos.filter(photo => photo.isTiff).length],
    ['Total', photos.length],
  ]);
  const descriptionByFileType = [...fileTypeAndNumber]
    .filter(([, number]) => number !== 0)
    .map(([fileType, number]) => `${fileType}: ${number}`)
    .join(' / ');

  return {
    numberOfLoadedFiles: photos.length,
    numberOfFilesWithGpsInfo: photos.filter(photo => photo.hasGpsInfo).length,
    descriptionByFileType,
  };
}
