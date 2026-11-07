export class LatLng {
  constructor(
    public latitude = 0,
    public longitude = 0) {
  }

  /**
   * Whether a latitude and a longitude read from EXIF are a place to put on the map: finite numbers within -90 to 90
   * and -180 to 180. A check by truthiness let through what Leaflet throws on: for a GPS block whose latitude and
   * longitude have no values and whose references are empty bytes, exifr 7.1.3 gives each as the text "NaNNaN", and
   * one such photo kept every photo of its folder off the map. 0 stays out, as it did with truthiness: a camera
   * without a fix can write it.
   */
  public static isLocation(latitude: unknown, longitude: unknown): boolean {
    return typeof latitude === 'number' && typeof longitude === 'number'
      && Number.isFinite(latitude) && Number.isFinite(longitude)
      && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
      && latitude !== 0 && longitude !== 0;
  }
}
