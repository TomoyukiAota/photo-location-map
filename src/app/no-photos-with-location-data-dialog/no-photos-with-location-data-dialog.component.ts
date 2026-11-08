import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-no-photos-with-location-data-dialog',
  templateUrl: './no-photos-with-location-data-dialog.component.html',
  styleUrls: ['./no-photos-with-location-data-dialog.component.scss'],
  imports: [MatButton, MatDialogClose]
})
export class NoPhotosWithLocationDataDialogComponent {
}
