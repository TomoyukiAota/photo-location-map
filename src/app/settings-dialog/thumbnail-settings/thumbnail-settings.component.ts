import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioButton, MatRadioChange, MatRadioGroup } from '@angular/material/radio';
import { ThumbnailQuality, thumbnailQualities } from '../../../../src-shared/user-settings/thumbnail-quality';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { SettingsChangedService } from '../service/settings-changed.service';
import { ThumbnailSettingsChangedParameter } from './thumbnail-settings-changed-parameter';

/** The texts of each choice: its name and what it does. */
const choiceTexts: Record<ThumbnailQuality, { label: TranslationKey, description: TranslationKey }> = {
  high: { label: 'settings.thumbnails.highQuality', description: 'settings.thumbnails.highQualityDescription' },
  fast: { label: 'settings.thumbnails.fast', description: 'settings.thumbnails.fastDescription' },
};

/**
 * The Thumbnails tab: the quality of the thumbnails of HEIF photos, against how soon they are shown
 * (src-shared/user-settings/thumbnail-quality.ts). It applies once saved, without a restart (SettingsDialogComponent).
 */
@Component({
  selector: 'app-thumbnail-settings',
  templateUrl: './thumbnail-settings.component.html',
  styleUrls: ['./thumbnail-settings.component.scss'],
  imports: [MatRadioGroup, MatRadioButton, FormsModule, TranslatePipe],
})
export class ThumbnailSettingsComponent {
  private readonly settingsChangedService = inject(SettingsChangedService);

  protected readonly choices = thumbnailQualities.map(quality => ({ quality, ...choiceTexts[quality] }));
  protected selectedQuality: ThumbnailQuality = currentUserSettings.thumbnailQuality;

  protected handleQualityChanged(change: MatRadioChange<ThumbnailQuality>): void {
    const parameter = new ThumbnailSettingsChangedParameter();
    parameter.thumbnailQuality = change.value;
    this.settingsChangedService.thumbnailSettingsChanged.next(parameter);
  }
}
