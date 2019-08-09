import { PhotoDataService } from '../shared/service/photo-data.service';
import { FlatNode } from './directory-tree-view.model';

export class DirTreeViewTooltipVisibilityLogic {
  private readonly photoDataService: PhotoDataService;

  constructor(photoDataService: PhotoDataService) {
    this.photoDataService = photoDataService;
  }

  public tooltipEnabled(flatNode: FlatNode): boolean {
    const photoExists = !!this.photoDataService.getPhoto(flatNode.path);
    return photoExists;
  }

  public onMouseEnter(flatNode: FlatNode, leafNodeDiv: HTMLDivElement, event: MouseEvent) {
    if (!this.tooltipEnabled(flatNode))
      return;

    const centerHeight = document.documentElement.clientHeight / 2;
    const isMousePositionInUpperHalf = event.clientY < centerHeight;
    const classToAdd = isMousePositionInUpperHalf ? 'visible-below' : 'visible-above';

    const tooltipContent: HTMLElement = leafNodeDiv.querySelector('.tooltip-content');
    tooltipContent.classList.add(classToAdd);
    tooltipContent.style.display = 'block';
  }

  public onMouseLeave(flatNode: FlatNode, leafNodeDiv: HTMLDivElement) {
    if (!this.tooltipEnabled(flatNode))
      return;

    const tooltipContent: HTMLElement = leafNodeDiv.querySelector('.tooltip-content');
    const fadeOutDuration = 300;  // ms

    let classToRemove: string;
    if (tooltipContent.classList.contains('visible-above')) {
      classToRemove = 'visible-above';
    } else if (tooltipContent.classList.contains('visible-below')) {
      classToRemove = 'visible-below';
    } else {
      return;
    }

    setTimeout(() => tooltipContent.classList.remove(classToRemove), fadeOutDuration);
    this.fadeOut(tooltipContent, fadeOutDuration);
  }

  // This function is taken from this link:
  // https://spyweb.media/2018/01/14/jquery-fadeout-pure-javascript/
  private fadeOut(node: HTMLElement, duration: number) {
    node.style.opacity = '1';
    const start = performance.now();

    requestAnimationFrame(function tick(timestamp: number) {
      const easing = (timestamp - start) / duration;
      node.style.opacity = Math.max(1 - easing, 0).toString();

      if (easing < 1) {
        requestAnimationFrame(tick);
      } else {
        node.style.opacity = '';
        node.style.display = 'none';
      }
    });
  }
}
