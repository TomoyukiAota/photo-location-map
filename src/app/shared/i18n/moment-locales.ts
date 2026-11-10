import moment from 'moment';
// The locale of each language of src-shared/i18n/languages.ts (`momentLocale`), from which a date gets its days of the
// week and its AM and PM. English is built into moment.
import 'moment/locale/ja';

// TL;DR: moment's global locale stays English; a date shown to the user gets its language's locale on a copy
// (../moment-to-string.ts).
// Details: Loading a locale also makes it moment's global locale, which every format() of the application would then
// use, among them those of the log and of analytics, which stay in English.
moment.locale('en');
