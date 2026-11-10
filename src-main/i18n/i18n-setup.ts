import { currentLanguage, systemLanguage } from '../../src-shared/i18n/i18n';
import { Logger } from '../../src-shared/log/logger';
import { currentUserSettings } from '../../src-shared/user-settings/user-settings';

// The language of the application's texts, decided when src-shared/i18n/i18n.ts is first imported: here, once the
// startup metadata and the settings can be read, and before the menu is built, which takes its labels at once
// (src-main/electron-main.ts).
Logger.info(`Language: ${currentLanguage}. The Language setting is "${currentUserSettings.language}", `
  + `and the operating system's language, among those the application has, is ${systemLanguage}.`);
