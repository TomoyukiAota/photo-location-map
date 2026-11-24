/** The last write of each thumbnail file to have started, by the thumbnail's path, until it has ended. */
const lastWrites = new Map<string, Promise<void>>();

/**
 * Runs `write`, which writes the thumbnail at `thumbnailFilePath` and its log, once each write of that thumbnail that
 * started before it has ended, and resolves or rejects as `write` does. Writes of other thumbnails do not wait, and a
 * write that fails lets the next one run.
 * TL;DR: A thumbnail and its log are written one after the other, so two writes of one thumbnail must not interleave,
 * as those of two sizes may once the settings changed while the previous size's was being written.
 * Details: Interleaved, the log of one write could be left beside the thumbnail of the other, which the cache would
 * then show as the size in the log, or the file could hold the bytes of both, until the photo changed.
 */
export function oneWriteAtATime<T>(thumbnailFilePath: string, write: () => Promise<T>): Promise<T> {
  const written = (lastWrites.get(thumbnailFilePath) ?? Promise.resolve()).then(write);
  const ended = written.then(() => undefined, () => undefined);
  lastWrites.set(thumbnailFilePath, ended);
  void ended.then(() => {
    if (lastWrites.get(thumbnailFilePath) === ended)
      lastWrites.delete(thumbnailFilePath);
  });
  return written;
}
