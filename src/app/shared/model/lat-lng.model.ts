export class LatLng {
  constructor(
    public latitude = 0,
    public longitude = 0) {
  }

  public add(another: LatLng) {
    if (!another)
      return null;

    return new LatLng(
      this.latitude + another.latitude,
      this.longitude + another.longitude
    );
  }
}

export function calculateCenterLatLng(latLngArray: LatLng[]) {
  if (!latLngArray || latLngArray.length === 0)
    return null;

  const total = latLngArray.reduce((previous, current) => previous.add(current));
  const center = new LatLng(
    total.latitude / latLngArray.length,
    total.longitude / latLngArray.length
  );
  return center;
}
