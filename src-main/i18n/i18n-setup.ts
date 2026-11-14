import { currentLanguage, systemLanguage, t } from '../../src-shared/i18n/i18n.js';
import { Logger } from '../../src-shared/log/logger.js';
import { currentUserSettings } from '../../src-shared/user-settings/user-settings.js';
import { translateUnhandledErrorDialog } from '../unhandled-errors.js';

// The language of the application's texts, decided when src-shared/i18n/i18n.ts is first imported: here, once the
// startup metadata and the settings can be read, and before the menu is built, which takes its labels at once
// (src-main/electron-main.ts).
Logger.info(`Language: ${currentLanguage}. The Language setting is "${currentUserSettings.language}", `
  + `and the operating system's language, among those the application has, is ${systemLanguage}.`);

// The dialog of an error that nothing handled is in English until here, as its handlers are set before the language
// can be decided (src-main/unhandled-errors.ts).
translateUnhandledErrorDialog(t);
