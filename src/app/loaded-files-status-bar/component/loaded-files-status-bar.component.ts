import { Component, computed } from '@angular/core';
import { PhotoDataService } from '../../shared/service/photo-data.service';
import { summarizeLoadedFiles } from './loaded-files-summary';

@Component({
  selector: 'app-loaded-files-status-bar',
  templateUrl: './loaded-files-status-bar.component.html',
  styleUrls: ['./loaded-files-status-bar.component.scss'],
  standalone: false
})
export class LoadedFilesStatusBarComponent {
  public readonly summary = computed(() => summarizeLoadedFiles(this.photoDataService.photos()));

  constructor(private photoDataService: PhotoDataService) { }
}
