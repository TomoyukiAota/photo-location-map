import { Component } from '@angular/core';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

/**
 * Over the whole window while files are dragged over it, and a drop would be taken (DropToOpenService): says that a
 * drop opens the folder, as the veil of Photo Data Viewer says what a dropped photo does.
 * The icon is folder_open of Material Icons (Apache License 2.0), drawn in the template rather than with mat-icon,
 * whose font is downloaded (src/index.html), so that it shows offline too.
 */
@Component({
  selector: 'app-drop-hint',
  templateUrl: './drop-hint.component.html',
  styleUrl: './drop-hint.component.scss',
  imports: [TranslatePipe],
})
export class DropHintComponent {}
