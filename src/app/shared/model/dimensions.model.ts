export class Dimensions {
  constructor(public readonly width,
              public readonly height) {
  }

  public floor(): Dimensions {
    const flooredWidth = Math.floor(this.width);
    const flooredHeight = Math.floor(this.height);
    return new Dimensions(flooredWidth, flooredHeight);
  }
}
