import { calculateCenterLatLng, LatLng } from './lat-lng.model';

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

  describe('add', () => {
    it('should return added latitude and longitude', () => {
      // Arrange
      const latLng1 = new LatLng(10, 11);
      const latLng2 = new LatLng(20, 21);

      // Act
      const addedLatLng = latLng1.add(latLng2);

      // Assert
      expect(addedLatLng.latitude).toEqual(latLng1.latitude + latLng2.latitude);
      expect(addedLatLng.longitude).toEqual(latLng1.longitude + latLng2.longitude);
    });

    describe('should return null', () => {
      const testCases = [
        {description: 'when null is passed'          , inputValue: null     },
        {description: 'when undefined is passed'     , inputValue: undefined}
      ];

      testCases.forEach(({description, inputValue}) => {
        it(description, () => {
          // Arrange
          const latLng = new LatLng(10, 11);

          // Act
          const addedLatLng = latLng.add(inputValue);

          // Assert
          expect(addedLatLng).toBeNull();
        });
      });
    });
  });

  describe('calculateCenterLatLng', () => {
    it('should return center latitude and longitude', () => {
      // Arrange
      const latLng1 = new LatLng(10, 12);
      const latLng2 = new LatLng(20, 22);
      const totalLatLng = latLng1.add(latLng2);
      const expectedCenterLat = totalLatLng.latitude / 2;
      const expectedCenterLng = totalLatLng.longitude / 2;

      // Act
      const actualCenterLatLng = calculateCenterLatLng([latLng1, latLng2]);

      // Assert
      expect(actualCenterLatLng.latitude).toEqual(expectedCenterLat);
      expect(actualCenterLatLng.longitude).toEqual(expectedCenterLng);
    });

    describe('should return null', () => {
      const testCases = [
        {description: 'when null is passed'          , inputValue: null     },
        {description: 'when undefined is passed'     , inputValue: undefined},
        {description: 'when an empty array is passed', inputValue: []       }
      ];

      testCases.forEach(({description, inputValue}) => {
        it(description, () => {
          const addedLatLng = calculateCenterLatLng(inputValue);
          expect(addedLatLng).toBeNull();
        });
      });
    });
  });
});
