import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PhotoDataService } from '../../shared/service/photo-data.service';
import { LoadedFilesStatusBarService } from '../service/loaded-files-status-bar.service';

@Component({
  selector: 'app-loaded-files-status-bar',
  templateUrl: './loaded-files-status-bar.component.html',
  styleUrls: ['./loaded-files-status-bar.component.scss']
})
export class LoadedFilesStatusBarComponent implements OnInit {
  public anyFileLoaded = false;

  public numberOfLoadedFiles: number;
  public numberOfFilesWithGpsInfo: number;

  public numberOfJpegFiles: number;
  public numberOfHeifFiles: number;
  public numberOfPngFiles: number;
  public numberOfTiffFiles: number;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private loadedFilesStatusBarService: LoadedFilesStatusBarService,
              private photoDataService: PhotoDataService) { }

  public ngOnInit(): void {
    this.loadedFilesStatusBarService.statusUpdateRequested.subscribe(() => {
      const allPhotos = this.photoDataService.getAllPhotos();
      this.anyFileLoaded = allPhotos.length >= 1;
      this.numberOfLoadedFiles = allPhotos.length;
      this.numberOfFilesWithGpsInfo = allPhotos.filter(photo => photo?.hasGpsInfo).length;
      this.numberOfJpegFiles = allPhotos.filter(photo => photo?.isJpeg).length;
      this.numberOfHeifFiles = allPhotos.filter(photo => photo?.isHeif).length;
      this.numberOfPngFiles = allPhotos.filter(photo => photo.isPng).length;
      this.numberOfTiffFiles = allPhotos.filter(photo => photo.isTiff).length;
      this.changeDetectorRef.detectChanges();
    });
  }

  public getDescriptionByFileType(): string {
    const fileTypeAndNumber = new Map<string, number>();
    fileTypeAndNumber.set('JPEG', this.numberOfJpegFiles);
    fileTypeAndNumber.set('HEIF', this.numberOfHeifFiles);
    fileTypeAndNumber.set('PNG', this.numberOfPngFiles);
    fileTypeAndNumber.set('TIFF', this.numberOfTiffFiles);
    fileTypeAndNumber.set('Total', this.numberOfLoadedFiles);

    let description = '';
    let isSeparatorNeeded = false;

    fileTypeAndNumber.forEach((number, fileType) => {
      if (number === 0) { return; }
      description = description.concat(`${isSeparatorNeeded ? ' / ' : ''}${fileType}: ${number}`);
      isSeparatorNeeded = true;
    });

    return description;
  }
}
