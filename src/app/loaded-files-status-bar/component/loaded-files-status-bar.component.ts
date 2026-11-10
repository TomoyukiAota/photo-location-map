import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { PhotoDataService } from '../../shared/service/photo-data.service';
import { summarizeLoadedFiles } from './loaded-files-summary';

@Component({
  selector: 'app-loaded-files-status-bar',
  templateUrl: './loaded-files-status-bar.component.html',
  styleUrls: ['./loaded-files-status-bar.component.scss'],
  imports: [TranslatePipe]
})
export class LoadedFilesStatusBarComponent {
  private photoDataService = inject(PhotoDataService);

  public readonly summary = computed(() => summarizeLoadedFiles(this.photoDataService.photos()));
}
