import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { PhotoDataService } from '../../shared/service/photo-data.service';

@Component({
  selector: 'app-dir-tree-view-photo-info',
  templateUrl: './dir-tree-view-photo-info.component.html',
  styleUrls: ['./dir-tree-view-photo-info.component.scss']
})
export class DirTreeViewPhotoInfoComponent implements AfterViewInit {
  @Input() public photoPath: string;
  @ViewChild('dirTreeViewPhotoInfo', { static: true }) public divElementRef: ElementRef<HTMLDivElement>;

  constructor(private photoDataService: PhotoDataService) {
  }

  public ngAfterViewInit() {
    const photo = this.photoDataService.getPhoto(this.photoPath);
    const contentRoot = PhotoInfoViewerContent.request('dir-tree-view', photo);
    this.adjustPhotoInfoViewerContentForDirTreeView(contentRoot);
    this.divElementRef.nativeElement.appendChild(contentRoot);
  }

  private adjustPhotoInfoViewerContentForDirTreeView(contentRoot: HTMLDivElement) {
    contentRoot.style.display = 'flex';
    contentRoot.style.alignItems = 'center';
    contentRoot.style.gap = '5px';

    const lowerDiv = (contentRoot.querySelector('.photo-info-viewer-lower-div') as HTMLElement);
    if (lowerDiv) {
      lowerDiv.style.display = 'flex';
      lowerDiv.style.flexDirection = 'column';
      lowerDiv.style.visibility = 'none';
      lowerDiv.style.opacity = '0';
      lowerDiv.style.transition = 'opacity 0.2s ease-in-out';
    }

    contentRoot.onmouseenter = () => {
      lowerDiv.style.visibility = 'visible';
      lowerDiv.style.opacity = '1';
    };

    contentRoot.onmouseleave = () => {
      lowerDiv.style.visibility = 'none';
      lowerDiv.style.opacity = '0';
    };

    const name = (contentRoot.querySelector('.photo-info-viewer-name') as HTMLElement);
    if (name) {
      name.style.display = 'none';
    }

    const dateTimeTaken = (contentRoot.querySelector('.photo-info-viewer-date-time-taken') as HTMLElement);
    if (dateTimeTaken) {
      dateTimeTaken.style.fontWeight = '400'; // The same value specified in .mat-tree-node
      dateTimeTaken.style.padding = '3px 0';
    }
  }
}
