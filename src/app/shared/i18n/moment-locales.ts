import moment from 'moment';
// The locale of each language of src-shared/i18n/languages.ts (`momentLocale`), from which a date gets its days of the
// week and its AM and PM. English is built into moment.
import 'moment/locale/ar';
import 'moment/locale/bg';
import 'moment/locale/ca';
import 'moment/locale/cs';
import 'moment/locale/da';
import 'moment/locale/de';
import 'moment/locale/el';
import 'moment/locale/es';
import 'moment/locale/et';
import 'moment/locale/eu';
import 'moment/locale/fi';
import 'moment/locale/fr';
import 'moment/locale/gl';
import 'moment/locale/he';
import 'moment/locale/hi';
import 'moment/locale/hr';
import 'moment/locale/hu';
import 'moment/locale/id';
import 'moment/locale/it';
import 'moment/locale/ja';
import 'moment/locale/ko';
import 'moment/locale/lt';
import 'moment/locale/lv';
import 'moment/locale/ms';
import 'moment/locale/nb';
import 'moment/locale/nl';
import 'moment/locale/pl';
import 'moment/locale/pt';
import 'moment/locale/pt-br';
import 'moment/locale/ro';
import 'moment/locale/ru';
import 'moment/locale/sk';
import 'moment/locale/sl';
import 'moment/locale/sr';
import 'moment/locale/sv';
import 'moment/locale/th';
import 'moment/locale/tr';
import 'moment/locale/uk';
import 'moment/locale/vi';
import 'moment/locale/zh-cn';
import 'moment/locale/zh-tw';

// TL;DR: A date is written with the digits 0 to 9 in every language, as the other numbers of the application are.
// Details: moment's Arabic and Hindi locales replace the digits of a date that they format with the Arabic-Indic and
// the Devanagari ones (`postformat`). The numbers in the texts, such as a count of photos, come from JavaScript as
// 0 to 9, so a date in other digits would stand beside them. `postformat` of the Arabic locale also replaces a comma,
// which no format of the application has.
for (const locale of ['ar', 'hi'])
  moment.updateLocale(locale, { postformat: (text: string) => text });

// TL;DR: moment's global locale stays English; a date shown to the user gets its language's locale on a copy
// (../moment-to-string.ts).
// Details: Loading a locale, or changing one as above, also makes it moment's global locale, which every format() of
// the application would then use, among them those of the log and of analytics, which stay in English.
moment.locale('en');
