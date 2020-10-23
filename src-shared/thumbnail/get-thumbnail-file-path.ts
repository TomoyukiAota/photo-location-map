import * as os from 'os';
import * as pathModule from 'path';

export function getThumbnailFilePath(srcFilePath: string) {
  const thumbnailFileName = `${pathModule.parse(srcFilePath).name}_plm`;
  const intermediateDir = pathModule.parse(
    // Convert "C:\\abc\\def.jpg" to "C\\abc\\def.jpg"
    srcFilePath.replace(':', '')
    // Convert "C\\abc\\def.jpg" to "C\\abc\\def"
    ).dir;
  const thumbnailFileDir = pathModule.join(os.homedir(), 'PlmCache', intermediateDir);
  const thumbnailFilePath = pathModule.join(thumbnailFileDir, `${thumbnailFileName}.jpg`);
  return { thumbnailFileDir, thumbnailFilePath };
}
