import { Service } from '@angular/core';
import { Subject } from 'rxjs';
import { AppearanceSettingsChangedParameter } from '../appearance-settings/appearance-settings-changed-parameter';
import { DateTimeSettingsChangedParameter } from '../date-time-settings/date-time-settings-changed-parameter';
import { LanguageSettingsChangedParameter } from '../language-settings/language-settings-changed-parameter';
import { ThumbnailSettingsChangedParameter } from '../thumbnail-settings/thumbnail-settings-changed-parameter';

@Service()
export class SettingsChangedService {
  public appearanceSettingsChanged = new Subject<AppearanceSettingsChangedParameter>();
  public dateTimeSettingsChanged = new Subject<DateTimeSettingsChangedParameter>();
  public languageSettingsChanged = new Subject<LanguageSettingsChangedParameter>();
  public thumbnailSettingsChanged = new Subject<ThumbnailSettingsChangedParameter>();
}
