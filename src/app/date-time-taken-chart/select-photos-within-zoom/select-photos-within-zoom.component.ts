import { afterNextRender, ChangeDetectorRef, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';
import { dateTimeTakenChartLogger as logger } from '../date-time-taken-chart-logger';

@Component({
  selector: 'app-select-photos-within-zoom',
  templateUrl: './select-photos-within-zoom.component.html',
  styleUrls: ['./select-photos-within-zoom.component.scss'],
  imports: [TranslatePipe]
})
export class SelectPhotosWithinZoomComponent {
  private directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private pinnedPhotoService = inject(PinnedPhotoService);
  private changeDetector = inject(ChangeDetectorRef);
  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');
  /**
   * The button's width, which the styles take as --width, for a text that needs more than the width that they give
   * the button: none for English and the other texts that fit it.
   */
  public readonly width = signal<string | null>(null);

  constructor() {
    // TL;DR: The button keeps its width in English, 106px, unless its text would take more than three lines: it is
    // then as wide as the text needs for three lines, up to 160px.
    // Details: The text is twice as long as the English one in most languages (see the styles), and the same rule
    // gives every language its width: English, Japanese and the other short texts keep 106px, and the longest ones
    // get up to 160px. The width is found by trying, as no style says "as narrow as three lines allow": a text's
    // lines depend on where its words end. This runs once, when the button is shown, before it is painted.
    afterNextRender(() => {
      const widthInEnglish = 106; // As the styles have it.
      const widest = 160;
      const mostLines = 3;
      const text = document.createRange();
      text.selectNodeContents(this.button().nativeElement);
      // The lines of the text, as the tops of the boxes that its lines are drawn in. Without a layout, as in the
      // unit tests, there is none.
      const lines = () => new Set(Array.from(text.getClientRects?.() ?? [], line => Math.round(line.top))).size;
      for (let width = widthInEnglish; lines() > mostLines && width < widest; ) {
        width += 2;
        this.width.set(`${width}px`);
        // The button has the new width before its lines are counted again.
        this.changeDetector.detectChanges();
      }
    });
  }

  public onButtonClicked() {
    logger.info('Clicked "Select Photos within Zoom" button.');
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Select Photos within Zoom`);
    const pinnedPhotos = this.pinnedPhotoService.getPinnedPhotos();
    const photoPaths = pinnedPhotos.map(photo => photo.path);
    this.directoryTreeViewSelectionService.select(photoPaths);
  }
}
