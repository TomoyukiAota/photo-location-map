export type BooleanSettingType = 'true' | 'false';

export class BooleanSetting {
  public static readonly TrueValue: BooleanSettingType = 'true';
  public static readonly FalseValue: BooleanSettingType = 'false';

  public static convertToBoolean(settingValue: BooleanSettingType): boolean {
    return settingValue === this.TrueValue;
  }

  public static convertToSettingValue(value: boolean): BooleanSettingType {
    return value ? this.TrueValue : this.FalseValue;
  }

  public static isSettingValueValid(settingValue: string | BooleanSettingType): boolean {
    const isValid = settingValue === this.TrueValue || settingValue === this.FalseValue;
    return isValid;
  }
}
