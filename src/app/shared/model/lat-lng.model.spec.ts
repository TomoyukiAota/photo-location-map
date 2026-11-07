import { LatLng } from './lat-lng.model';

describe('LatLng', () => {
  it('should contain latitude and longitude', () => {
    // Arrange
    const latitude = 10;
    const longitude = 20;

    // Act
    const latLng = new LatLng(latitude, longitude);

    // Assert
    expect(latLng.latitude).toEqual(latitude);
    expect(latLng.longitude).toEqual(longitude);
  });

  describe('isLocation', () => {
    it('takes numbers within the range of latitude and longitude', () => {
      expect(LatLng.isLocation(34.688075, 135.19586111111113)).toBe(true);
      expect(LatLng.isLocation(-28.006441666666667, -122.00566111111111)).toBe(true);
      expect(LatLng.isLocation(90, 180)).toBe(true);
      expect(LatLng.isLocation(-90, -180)).toBe(true);
    });

    it('refuses what exifr gives for a GPS block whose values are empty', () => {
      expect(LatLng.isLocation('NaNNaN', 'NaNNaN')).toBe(false);
      expect(LatLng.isLocation('NNaNNaN', 'ENaNNaN')).toBe(false);
      expect(LatLng.isLocation(NaN, NaN)).toBe(false);
    });

    it('refuses numbers in text, infinities and values out of range', () => {
      expect(LatLng.isLocation('34.688075', '135.195861')).toBe(false);
      expect(LatLng.isLocation(Infinity, 135)).toBe(false);
      expect(LatLng.isLocation(34, -Infinity)).toBe(false);
      expect(LatLng.isLocation(90.0001, 135)).toBe(false);
      expect(LatLng.isLocation(34, 180.0001)).toBe(false);
    });

    it('refuses 0, as the check by truthiness did, and missing values', () => {
      expect(LatLng.isLocation(0, 0)).toBe(false);
      expect(LatLng.isLocation(34, 0)).toBe(false);
      expect(LatLng.isLocation(0, 135)).toBe(false);
      expect(LatLng.isLocation(undefined, undefined)).toBe(false);
      expect(LatLng.isLocation(34, null)).toBe(false);
    });
  });
});
