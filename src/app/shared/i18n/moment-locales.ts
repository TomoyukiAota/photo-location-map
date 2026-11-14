import moment from 'moment';
// The locale of each language of src-shared/i18n/languages.ts (`momentLocale`), from which a date gets its days of the
// week and its AM and PM. English is built into moment.
import 'moment/locale/ar.js';
import 'moment/locale/bg.js';
import 'moment/locale/ca.js';
import 'moment/locale/cs.js';
import 'moment/locale/da.js';
import 'moment/locale/de.js';
import 'moment/locale/el.js';
import 'moment/locale/es.js';
import 'moment/locale/et.js';
import 'moment/locale/eu.js';
import 'moment/locale/fi.js';
import 'moment/locale/fr.js';
import 'moment/locale/gl.js';
import 'moment/locale/he.js';
import 'moment/locale/hi.js';
import 'moment/locale/hr.js';
import 'moment/locale/hu.js';
import 'moment/locale/id.js';
import 'moment/locale/it.js';
import 'moment/locale/ja.js';
import 'moment/locale/ko.js';
import 'moment/locale/lt.js';
import 'moment/locale/lv.js';
import 'moment/locale/ms.js';
import 'moment/locale/nb.js';
import 'moment/locale/nl.js';
import 'moment/locale/pl.js';
import 'moment/locale/pt.js';
import 'moment/locale/pt-br.js';
import 'moment/locale/ro.js';
import 'moment/locale/ru.js';
import 'moment/locale/sk.js';
import 'moment/locale/sl.js';
import 'moment/locale/sr.js';
import 'moment/locale/sv.js';
import 'moment/locale/th.js';
import 'moment/locale/tr.js';
import 'moment/locale/uk.js';
import 'moment/locale/vi.js';
import 'moment/locale/zh-cn.js';
import 'moment/locale/zh-tw.js';

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
