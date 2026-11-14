import { readdirSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { languages } from './languages.js';
import en from './locales/en.json' with { type: 'json' };

// What a translation pull request is checked against (docs/TRANSLATING.md). Every file of locales/ is read from the
// checkout, which the tests run in, so that one missing from languages.ts is found too.
const localesDirectory = path.join(process.cwd(), 'src-shared', 'i18n', 'locales');
const files = readdirSync(localesDirectory).filter(file => file.endsWith('.json')).sort();

type Texts = Record<string, string>;

/** The texts of a file, each under its full key, such as `settings.cache.title`. */
function flatten(value: unknown, prefix = ''): Texts {
  if (typeof value === 'string')
    return { [prefix]: value };
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${prefix} is neither a text nor an object of texts`);
  return Object.assign({}, ...Object.entries(value).map(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key)));
}

/** The `{{placeholders}}` of a text, sorted. */
function placeholders(text: string): string {
  return (text.match(/\{\{[^}]*\}\}/g) ?? []).map(placeholder => placeholder.replace(/\s/g, '')).sort().join(' ');
}

/** The `<tags>` of a text, sorted. */
function tags(text: string): string {
  return (text.match(/<\/?[a-zA-Z][^>]*>/g) ?? []).map(tag => tag.replace(/\s/g, '')).sort().join(' ');
}

const english = flatten(en);

describe('The translation files (src-shared/i18n/locales)', () => {
  it('are each listed once in languages.ts, with a file for each language listed', () => {
    const codes = languages.map(language => language.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.map(code => `${code}.json`).sort()).toEqual(files);
  });

  it('have an English text for every key, and no empty English text', () => {
    expect(Object.keys(english).filter(key => english[key].trim() === '')).toEqual([]);
  });

  describe.each(files)('%s', file => {
    const texts = flatten(JSON.parse(readFileSync(path.join(localesDirectory, file), 'utf8')));
    const missing = Object.keys(english).filter(key => !(key in texts));
    if (missing.length > 0)
      console.info(`${file}: ${missing.length} text(s) not translated yet are shown in English: ${missing.join(', ')}`);

    it('has only keys that en.json has', () => {
      expect(Object.keys(texts).filter(key => !(key in english))).toEqual([]);
    });

    it('has no empty text: a text not translated yet is left out, and shown in English', () => {
      expect(Object.keys(texts).filter(key => texts[key].trim() === '')).toEqual([]);
    });

    it('keeps the {{placeholders}} of each English text', () => {
      expect(Object.keys(texts).filter(key => key in english && placeholders(texts[key]) !== placeholders(english[key]))).toEqual([]);
    });

    it('keeps the <tags> of each English text', () => {
      expect(Object.keys(texts).filter(key => key in english && tags(texts[key]) !== tags(english[key]))).toEqual([]);
    });

    it('keeps ddd, the day of the week, in dateTime.weekdayPattern', () => {
      // The one value that is a pattern of moment, not a text (docs/TRANSLATING.md).
      expect(texts['dateTime.weekdayPattern'] ?? 'ddd').toContain('ddd');
    });
  });
});
