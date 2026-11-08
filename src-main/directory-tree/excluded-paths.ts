/* eslint-disable no-useless-escape */

/** The hidden files and folders of Windows and macOS, which a folder's tree leaves out. */
export const excludedPathPatterns: RegExp[] = [
  // Notes:
  // - The purpose of regex is to exclude the hidden files/folders.
  // - Regex should be as specific as possible in order not to accidentally exclude visible files/folders.
  // - Regex begins from [\/\\] (/ or \ for path separator) to be sure of the beginning of a file/folder name.
  // - For files, $ is placed at the end to be sure of specifying file paths.
  // - Using i flag to ignore case. e.g. both $RECYCLE.BIN and $Recycle.Bin exist.

  // Windows
  /[\/\\]\$Recycle\.Bin/i,
  /[\/\\]desktop\.ini$/i,
  /[\/\\]Thumbs\.db$/i,

  // Mac - Anywhere
  /[\/\\]\._.*/i,
  /[\/\\]\.AppleDouble/i,
  /[\/\\]\.DS_Store$/i,
  /[\/\\]\.localized$/i,
  /[\/\\]__MACOSX/i,

  // Mac - Root of a Volume
  /[\/\\]\.apdisk$/i,
  /[\/\\]\.com\.apple\.timemachine\.donotpresent$/i,
  /[\/\\]\.DocumentRevisions-V100/i,
  /[\/\\]\.fseventsd/i,
  /[\/\\]\.Spotlight-V100/i,
  /[\/\\]\.TemporaryItems/i,
  /[\/\\]\.Trashes/i,
  /[\/\\]\.VolumeIcon\.icns/i,
];
