export class Dimensions {
  constructor(public readonly width: number,
              public readonly height: number) {
  }

  public floor(): Dimensions {
    const flooredWidth = Math.floor(this.width);
    const flooredHeight = Math.floor(this.height);
    return new Dimensions(flooredWidth, flooredHeight);
  }

  public cropToSquare(): Dimensions {
    return (this.width < this.height)
      ? new Dimensions(this.width, this.width)
      : new Dimensions(this.height, this.height);
  }

  public expandToSquare(): Dimensions {
    return (this.width > this.height)
      ? new Dimensions(this.width, this.width)
      : new Dimensions(this.height, this.height);
  }
}
