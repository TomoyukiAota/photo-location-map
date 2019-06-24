import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PhotoDataService } from '../../shared/service/photo-data.service';
import { Photo } from '../../shared/model/photo.model';
import { PhotoQuickViewerContent } from '../../info-window/photo-quick-viewer-content';

@Component({
  selector: 'app-dir-tree-view-tooltip',
  templateUrl: './dir-tree-view-tooltip.component.html',
  styleUrls: ['./dir-tree-view-tooltip.component.scss']
})
export class DirTreeViewTooltipComponent implements AfterViewInit, OnInit {
  @Input() public photoPath: string;
  @ViewChild('dirTreeViewTooltip') public divElementRef: ElementRef<HTMLDivElement>;
  private photo: Photo;

  constructor(private photoDataService: PhotoDataService) {
  }

  ngOnInit() {
    this.photo = this.photoDataService.getPhoto(this.photoPath);
  }

  ngAfterViewInit() {
    const content = PhotoQuickViewerContent.generate(this.photo);
    this.divElementRef.nativeElement.appendChild(content);
  }
}
