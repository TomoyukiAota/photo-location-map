export class LoadingFolderProgress {
  public static reset(): void {
    numberOfAllFilesToLoad = 0;
    numberOfLoadedFiles = 0;
  }

  public static setNumberOfAllFilesToLoad(number: number): void {
    numberOfAllFilesToLoad = number;
  }

  public static incrementNumberOfLoadedFiles(): void {
    numberOfLoadedFiles++;
  }

  public static get numberOfAllFilesToLoad(): number {
    return numberOfAllFilesToLoad;
  }

  public static get numberOfLoadedFiles(): number {
    return numberOfLoadedFiles;
  }

  public static get numberOfRemainingFiles(): number {
    return numberOfAllFilesToLoad - numberOfLoadedFiles;
  }
}

let numberOfAllFilesToLoad = 0;
let numberOfLoadedFiles = 0;
