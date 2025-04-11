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
});
