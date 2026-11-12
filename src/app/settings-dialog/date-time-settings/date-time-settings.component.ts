import { Component, inject } from '@angular/core';
import { MatSelectChange, MatSelect, MatOption } from '@angular/material/select';
import moment from 'moment-timezone';
import { DateTimeFormat } from '../../../../src-shared/date-time/date-time-format';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { t } from '../../../../src-shared/i18n/i18n';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { formatMomentForUser } from '../../shared/moment-to-string';
import { SettingsChangedService } from '../service/settings-changed.service';
import { DateTimeSettingsChangedParameter } from './date-time-settings-changed-parameter';
import { MatFormField, MatLabel } from '@angular/material/form-field';

@Component({
  selector: 'app-date-time-settings',
  templateUrl: './date-time-settings.component.html',
  styleUrls: ['./date-time-settings.component.scss'],
  imports: [MatFormField, MatLabel, MatSelect, MatOption, TranslatePipe]
})
export class DateTimeSettingsComponent {
  private settingsChangedService = inject(SettingsChangedService);

  public dateFormatList = DateTimeFormat.ForUser.DateFormat_List;
  public clockSystemFormatList = DateTimeFormat.ForUser.ClockSystemFormat_List;
  /** The names of the clock formats; the formats themselves, `12-hour` and `24-hour`, are what is saved. */
  public readonly clockSystemFormatLabelKeys: Record<DateTimeFormat.ForUser.ClockSystemFormatType, TranslationKey> = {
    [DateTimeFormat.ForUser.ClockSystemFormat_12h]: 'settings.dateTime.clock12',
    [DateTimeFormat.ForUser.ClockSystemFormat_24h]: 'settings.dateTime.clock24',
  };
  /**
   * The choices of each field, one on a line: what the field's box takes its width from (see the styles), so that the
   * widest choice fits in the field and in the list of its choices, in any language.
   */
  public readonly dateFormatChoices = this.dateFormatList.join('\n');
  public readonly clockSystemFormatChoices = this.clockSystemFormatList.map(format => t(this.clockSystemFormatLabelKeys[format])).join('\n');
  public selectedDateFormat = currentUserSettings.dateFormat;
  public selectedClockSystemFormat = currentUserSettings.clockSystemFormat;

  public getDateTimeNow() {
    const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateTimeFormat(this.selectedDateFormat, this.selectedClockSystemFormat);
    // AM and PM are in the application's language, as in the dates that the application shows.
    const now = formatMomentForUser(moment('2019-11-25T14:53:29.396Z').utc(), momentJsFormatString);
    return now;
  }

  public notifySettingsChanged(event: MatSelectChange) {
    const parameter = new DateTimeSettingsChangedParameter();
    parameter.dateFormat = this.selectedDateFormat;
    parameter.clockSystemFormat = this.selectedClockSystemFormat;
    this.settingsChangedService.dateTimeSettingsChanged.next(parameter);
    event.source.close();
  }
}
