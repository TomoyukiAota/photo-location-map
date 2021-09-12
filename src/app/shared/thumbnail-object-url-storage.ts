export class ThumbnailObjectUrlStorage {
  public static add(objectUrl: string): void {
    objectUrlArray.push(objectUrl);
  }

  public static revokeObjectUrls(): void {
    objectUrlArray.forEach(url => URL.revokeObjectURL(url));
    objectUrlArray.length = 0;
  }
}

const objectUrlArray: string[] = [];
