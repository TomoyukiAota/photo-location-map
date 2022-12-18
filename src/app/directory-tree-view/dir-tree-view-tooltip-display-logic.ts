import * as _ from 'lodash';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { FlatNode } from './directory-tree-view.model';

export class DirTreeViewTooltipDisplayLogic {
  private readonly tooltipSelector = 'app-dir-tree-view-tooltip';
  private readonly tooltipVisibleCssClass = 'tooltip-visible';
  private readonly photoDataService: PhotoDataService;

  constructor(photoDataService: PhotoDataService) {
    this.photoDataService = photoDataService;
  }

  public tooltipEnabled(flatNode: FlatNode): boolean {
    const photoExists = !!this.photoDataService.getPhoto(flatNode.path);
    return photoExists;
  }

  public onMouseEnter(flatNode: FlatNode, tooltipTarget: HTMLElement) {
    if (!this.tooltipEnabled(flatNode))
      return;

    const tooltip: HTMLElement = tooltipTarget.querySelector(this.tooltipSelector);
    tooltip.style.display = 'block'; // "display: block" is needed before getBoundingClientRect() used in tooltip position calculation
    this.configureTooltipPosition(tooltipTarget, tooltip);
    tooltip.classList.add(this.tooltipVisibleCssClass);
  }

  private configureTooltipPosition(targetElement: HTMLElement, tooltipElement: HTMLElement) {
    const sidebarElement = document.querySelector('#home-left-sidebar');
    const sidebar = sidebarElement.getBoundingClientRect();
    const target = targetElement.getBoundingClientRect();
    const tooltip = tooltipElement.getBoundingClientRect();

    // Determine tooltip left position based on app-sidebar, not targetElement,
    // because targetElement can be wider than app-sidebar depending on the splitter gutter position.
    tooltipElement.style.left = `${sidebar.width - 30}px`;

    const tooltipTop = this.calculateTooltipTop(sidebar, target, tooltip);
    tooltipElement.style.top = `${tooltipTop}px`;
  }

  private calculateTooltipTop(sidebar: DOMRect, target: DOMRect, tooltip: DOMRect) {
    const idealTooltipTop = target.top + (target.height / 2) - (tooltip.height / 2);
    const gap = 5; // Put some gap for better layout
    const tooltipTopLowerLimit = gap;
    const tooltipTopUpperLimit = sidebar.height - gap - tooltip.height;
    const tooltipTop = _.clamp(idealTooltipTop, tooltipTopLowerLimit, tooltipTopUpperLimit);
    return tooltipTop;
  }

  public onMouseLeave(flatNode: FlatNode, tooltipTarget: HTMLElement) {
    if (!this.tooltipEnabled(flatNode))
      return;

    const tooltip: HTMLElement = tooltipTarget.querySelector(this.tooltipSelector);
    const fadeOutDuration = 300;  // ms
    setTimeout(() => tooltip.classList.remove(this.tooltipVisibleCssClass), fadeOutDuration);
    this.fadeOut(tooltip, fadeOutDuration);
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
