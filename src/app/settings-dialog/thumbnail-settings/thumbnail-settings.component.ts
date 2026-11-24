import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, createCloseScrollStrategy } from '@angular/cdk/overlay';
import { Component, inject, Injector } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { t } from '../../../../src-shared/i18n/i18n';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
import { ThumbnailQuality, thumbnailQualities } from '../../../../src-shared/user-settings/thumbnail-quality';
import {
  maxThumbnailSize,
  minThumbnailSize,
  thumbnailSizes,
  thumbnailSizeStep
} from '../../../../src-shared/user-settings/thumbnail-size';
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
 * The sizes written under the slider, from the smallest to the largest: every other mark. The slider's marks are 39
 * pixels apart, which left "900" and "1000" 7 pixels apart, too close to read as two sizes.
 */
const sizeTickStep = 200;

/**
 * Where the note on the size opens: centered under its button, or above it when there is no room under it. The button
 * is near the middle of the tab, so that the note stays over the dialog: from where the button started, it reached
 * past the dialog's edge. From where the button ends or starts when a narrow window leaves no room to a side.
 */
const sizeNotePositions: ConnectedPosition[] = [
  { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 4 },
  { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -4 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
];

/**
 * The Thumbnails tab: the quality of the thumbnails, against how soon they are shown
 * (src-shared/user-settings/thumbnail-quality.ts), and under High quality their size, with a slider
 * (src-shared/user-settings/thumbnail-size.ts), which is disabled while Fast is chosen, as the thumbnails that the
 * photos hold have sizes of their own. They apply once saved, without a restart (SettingsDialogComponent). What a
 * larger size costs is in a note that a button beside the slider opens. Under them, the cache of the thumbnails that
 * are made (CacheSettingsComponent).
 */
@Component({
  selector: 'app-thumbnail-settings',
  templateUrl: './thumbnail-settings.component.html',
  styleUrls: ['./thumbnail-settings.component.scss'],
  imports: [
    MatRadioGroup, MatRadioButton, MatSlider, MatSliderThumb, MatIconButton, MatIcon, CdkOverlayOrigin, CdkConnectedOverlay,
    FormsModule, TranslatePipe, CacheSettingsComponent,
  ],
})
export class ThumbnailSettingsComponent {
  private readonly settingsChangedService = inject(SettingsChangedService);

  protected readonly choices = thumbnailQualities.map(quality => ({ quality, ...choiceTexts[quality] }));
  protected selectedQuality: ThumbnailQuality = currentUserSettings.thumbnailQuality;
  protected selectedSize: number = currentUserSettings.thumbnailSize;

  protected readonly minSize = minThumbnailSize;
  protected readonly maxSize = maxThumbnailSize;
  protected readonly sizeStep = thumbnailSizeStep;

  /** The sizes written under the slider, each where its mark is: a percentage of the way from the first to the last. */
  protected readonly sizeTicks = thumbnailSizes
    .filter(size => (size - minThumbnailSize) % sizeTickStep === 0)
    .map(size => ({ size, position: (size - minThumbnailSize) / (maxThumbnailSize - minThumbnailSize) * 100 }));

  /** The size as it is read: shown beside the slider, and said by a screen reader on its thumb. */
  protected readonly sizeText = (size: number): string => t('settings.thumbnails.sizeValue', { size });

  /** Whether the note on what a larger size costs is open. */
  protected isSizeNoteOpen = false;
  protected readonly sizeNotePositions = sizeNotePositions;
  /** The note closes when the tab scrolls, rather than staying where the button was (SettingsDialogComponent). */
  protected readonly sizeNoteScrollStrategy = createCloseScrollStrategy(inject(Injector));

  protected handleQualityChanged(quality: ThumbnailQuality): void {
    this.selectedQuality = quality;
    this.notifyChanged();
  }

  protected handleSizeChanged(size: number): void {
    this.selectedSize = size;
    this.notifyChanged();
  }

  protected toggleSizeNote(): void {
    this.isSizeNoteOpen = !this.isSizeNoteOpen;
  }

  protected closeSizeNote(): void {
    this.isSizeNoteOpen = false;
  }

  /** A click elsewhere closes the note, but one on its button, which closes it on its own (toggleSizeNote). */
  protected closeSizeNoteOnClickOutside(event: MouseEvent, button: HTMLElement): void {
    if (!button.contains(event.target as Node))
      this.closeSizeNote();
  }

  protected closeSizeNoteOnEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape')
      this.closeSizeNote();
  }

  private notifyChanged(): void {
    const parameter = new ThumbnailSettingsChangedParameter();
    parameter.thumbnailQuality = this.selectedQuality;
    parameter.thumbnailSize = this.selectedSize;
    this.settingsChangedService.thumbnailSettingsChanged.next(parameter);
  }
}
