export class LoadingFolderProgress {
  public static reset(): void {
    numberOfAllFilesToLoad = 0;
    numberOfLoadedFiles = 0;
    isStarted = false;
    isInProgress = false;
    isCompleted = false;
  }

  public static setNumberOfAllFilesToLoad(number: number): void {
    numberOfAllFilesToLoad = number;
    isStarted = true;
    isInProgress = true;
  }

  public static incrementNumberOfLoadedFiles(): void {
    numberOfLoadedFiles++;
    isInProgress = numberOfLoadedFiles < numberOfAllFilesToLoad;
    isCompleted = numberOfLoadedFiles >= numberOfAllFilesToLoad;
  }

  public static get numberOfAllFilesToLoad(): number {
    return numberOfAllFilesToLoad;
  }

  public static get numberOfLoadedFiles(): number {
    return numberOfLoadedFiles;
  }

  public static get loadedPercent(): number {
    return isStarted
      ? numberOfLoadedFiles / numberOfAllFilesToLoad * 100
      : 0;
  }

  public static get isStarted():    boolean { return isStarted;    }
  public static get isInProgress(): boolean { return isInProgress; }
  public static get isCompleted():  boolean { return isCompleted;  }
}

let numberOfAllFilesToLoad = 0;
let numberOfLoadedFiles = 0;
let isStarted = false;
let isInProgress = false;
let isCompleted = false;
