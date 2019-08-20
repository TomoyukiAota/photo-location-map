export enum MapType {
  GoogleMaps,
  OpenStreetMap
}

export const getMapType = (mapTypeStr: string) => {
  switch (mapTypeStr) {
    case 'GoogleMaps':
      return MapType.GoogleMaps;
    case 'OpenStreetMap':
      return MapType.OpenStreetMap;
  }
};
