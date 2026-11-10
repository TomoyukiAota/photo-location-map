import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogClose } from '@angular/material/dialog';
import { TranslatePipe } from '../shared/i18n/translate.pipe';

@Component({
  selector: 'app-no-photos-with-location-data-dialog',
  templateUrl: './no-photos-with-location-data-dialog.component.html',
  styleUrls: ['./no-photos-with-location-data-dialog.component.scss'],
  imports: [MatButton, MatDialogClose, TranslatePipe]
})
export class NoPhotosWithLocationDataDialogComponent {
}
