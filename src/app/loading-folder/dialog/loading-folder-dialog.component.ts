import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-folder-dialog',
  templateUrl: './loading-folder-dialog.component.html',
  styleUrls: ['./loading-folder-dialog.component.scss']
})
export class LoadingFolderDialogComponent implements OnInit {

  // TODO: Inject LoadingFolderProgressReporterService and get progress text to display on the dialog.
  constructor() { }

  ngOnInit() {
  }

}
