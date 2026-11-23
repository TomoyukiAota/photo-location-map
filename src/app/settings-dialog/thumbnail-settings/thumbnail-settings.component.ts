import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { t } from '../../../../src-shared/i18n/i18n';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
import { ThumbnailQuality, thumbnailQualities } from '../../../../src-shared/user-settings/thumbnail-quality';
import { maxThumbnailSize, minThumbnailSize, thumbnailSizeStep } from '../../../../src-shared/user-settings/thumbnail-size';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { CacheSettingsComponent } from '../cache-settings/cache-settings.component';
import { SettingsChangedService } from '../service/settings-changed.service';
import { ThumbnailSettingsChangedParameter } from './thumbnail-settings-changed-parameter';

/** The texts of each choice: its name and what it does. */
const choiceTexts: Record<ThumbnailQuality, { label: TranslationKey, description: TranslationKey }> = {
  high: { label: 'settings.thumbnails.highQuality', description: 'settings.thumbnails.highQualityDescription' },
  fast: { label: 'settings.thumbnails.fast', description: 'settings.thumbnails.fastDescription' },
};

/**
 * The Thumbnails tab: the quality of the thumbnails, against how soon they are shown
 * (src-shared/user-settings/thumbnail-quality.ts), and under High quality their size, with a slider
 * (src-shared/user-settings/thumbnail-size.ts), which is disabled while Fast is chosen, as the thumbnails that the
 * photos hold have sizes of their own. They apply once saved, without a restart (SettingsDialogComponent). Under them,
 * the cache of the thumbnails that are made (CacheSettingsComponent).
 */
@Component({
  selector: 'app-thumbnail-settings',
  templateUrl: './thumbnail-settings.component.html',
  styleUrls: ['./thumbnail-settings.component.scss'],
  imports: [MatRadioGroup, MatRadioButton, MatSlider, MatSliderThumb, FormsModule, TranslatePipe, CacheSettingsComponent],
})
export class ThumbnailSettingsComponent {
  private readonly settingsChangedService = inject(SettingsChangedService);

  protected readonly choices = thumbnailQualities.map(quality => ({ quality, ...choiceTexts[quality] }));
  protected selectedQuality: ThumbnailQuality = currentUserSettings.thumbnailQuality;
  protected selectedSize: number = currentUserSettings.thumbnailSize;

  protected readonly minSize = minThumbnailSize;
  protected readonly maxSize = maxThumbnailSize;
  protected readonly sizeStep = thumbnailSizeStep;

  /** The size as it is read: shown beside the slider, and said by a screen reader on its thumb. */
  protected readonly sizeText = (size: number): string => t('settings.thumbnails.sizeValue', { size });

  protected handleQualityChanged(quality: ThumbnailQuality): void {
    this.selectedQuality = quality;
    this.notifyChanged();
  }

  protected handleSizeChanged(size: number): void {
    this.selectedSize = size;
    this.notifyChanged();
  }

  private notifyChanged(): void {
    const parameter = new ThumbnailSettingsChangedParameter();
    parameter.thumbnailQuality = this.selectedQuality;
    parameter.thumbnailSize = this.selectedSize;
    this.settingsChangedService.thumbnailSettingsChanged.next(parameter);
  }
}
