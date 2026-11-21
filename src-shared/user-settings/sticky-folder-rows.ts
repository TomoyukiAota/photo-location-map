/**
 * How the folder tree keeps the rows of the folders above the rows that it shows at its top while it is scrolled
 * (src/app/directory-tree-view/dir-tree-view-sticky-rows/), which the Appearance tab of the Settings dialog sets:
 * - The most rows that it keeps there, one of which stands for the folders left out when there are more.
 * - Which folders it leaves out then: those in the middle, those near the opened folder, or those near the photos.
 *   The opened folder and the folder of the rows shown are always kept.
 * TL;DR: At most 7 rows, leaving out the folders in the middle, by default, which the owner chose: the opened folder,
 * the two folders below it, the row of the folders left out, and the three folders above the rows shown.
 */
export type StickyFolderRowsLeftOut = 'middle' | 'nearOpenedFolder' | 'nearPhotos';

export const stickyFolderRowsLeftOutChoices: readonly StickyFolderRowsLeftOut[] = ['middle', 'nearOpenedFolder', 'nearPhotos'];
export const defaultStickyFolderRowsLeftOut: StickyFolderRowsLeftOut = 'middle';

export function isStickyFolderRowsLeftOut(value: unknown): value is StickyFolderRowsLeftOut {
  return stickyFolderRowsLeftOutChoices.includes(value as StickyFolderRowsLeftOut);
}

/**
 * The choices of the most rows: from 3, the opened folder, the row of the folders left out and the folder of the rows
 * shown, to 10.
 */
export const stickyFolderRowsMaximumChoices: readonly number[] = [3, 4, 5, 6, 7, 8, 9, 10];
export const defaultStickyFolderRowsMaximum = 7;

export function isStickyFolderRowsMaximum(value: unknown): value is number {
  return stickyFolderRowsMaximumChoices.includes(value as number);
}

/** The most rows that `value` saves, or undefined when it is not one of the choices. */
export function stickyFolderRowsMaximumOf(value: unknown): number | undefined {
  const maximum = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  return isStickyFolderRowsMaximum(maximum) ? maximum : undefined;
}
