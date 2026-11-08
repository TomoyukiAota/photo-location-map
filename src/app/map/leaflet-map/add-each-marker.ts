/**
 * Adds each photo's marker, so that a photo whose marker cannot be made leaves the others on the map. Before, an
 * exception for one photo ended the loop before the marker cluster group was added to the map, and the whole folder
 * had no markers. The error goes to onError, to be logged and recorded.
 */
export function addEachMarker<T>(photos: readonly T[],
                                 addMarker: (photo: T) => void,
                                 onError: (error: unknown, photo: T) => void): void {
  for (const photo of photos) {
    try {
      addMarker(photo);
    } catch (error) {
      onError(error, photo);
    }
  }
}
