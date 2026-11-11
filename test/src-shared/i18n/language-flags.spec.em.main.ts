import assert = require('assert');
import * as fs from 'fs';
import * as path from 'path';
import { languages } from '../../../src-shared/i18n/languages';

/** The languages whose flag is not that of the region of their likely subtags, and why (src-shared/i18n/languages.ts). */
const flagsOfTheirOwn: Readonly<Record<string, string>> = {
  ca: 'es-ct', // Catalonia, not Spain.
  eu: 'es-pv', // The Basque Country, not Spain.
  gl: 'es-ga', // Galicia, not Spain.
  ar: 'arab', // The Arab League, not Egypt.
};

const root = path.join(__dirname, '..', '..', '..');
const flagIcons = path.join(root, 'node_modules', 'flag-icons');

/** The flags that the styles of the list of languages include, which the build copies into the application. */
function flagsInStyles(): string[] {
  const styles = fs.readFileSync(path.join(root, 'src', 'app', 'language', 'language-list.component.scss'), 'utf8');
  const included = /\$flag-icons-included-countries:\s*\(([^)]*)\)/.exec(styles);
  assert.ok(included, 'language-list.component.scss lists no $flag-icons-included-countries');
  return [...included[1].matchAll(/"([^"]+)"/g)].map(([, flag]) => flag);
}

describe('The flags of the languages (src-shared/i18n/languages.ts)', () => {
  it('are those of the region that Unicode gives each language, but for the languages with flags of their own', () => {
    for (const { code, flag } of languages) {
      const expected = flagsOfTheirOwn[code] ?? new Intl.Locale(code).maximize().region.toLowerCase();
      assert.strictEqual(flag, expected, code);
    }
  });

  it('are each in the flag-icons package, in their rectangular shape', () => {
    for (const { code, flag } of languages)
      assert.ok(fs.existsSync(path.join(flagIcons, 'flags', '4x3', `${flag}.svg`)), `${flag}.svg of ${code}`);
  });

  it('are the flags that the styles include, and no others, so that the application has each of them', () => {
    assert.deepStrictEqual(flagsInStyles().sort(), [...new Set(languages.map(language => language.flag))].sort());
  });
});
