import * as pathModule from 'path';

export function getThumbnailFilePath(srcFilePath: string) {
  const thumbnailFileName = `${pathModule.parse(srcFilePath).name}_plmThumb`;
  const intermediateDir = pathModule.parse(
    srcFilePath.replace(':', '') // Replace C:\\abc\\def.jpg to C\\abc\\def.jpg
  ).dir;                                          // From C\\abc\\def.jpg, get C\\abc\\def
  const thumbnailFileDir = pathModule.join('C:', 'plmTemp', intermediateDir);
  const thumbnailFilePath = pathModule.join(thumbnailFileDir, `${thumbnailFileName}.jpg`);
  return { thumbnailFileDir, thumbnailFilePath };
}
