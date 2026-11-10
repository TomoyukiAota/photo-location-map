// The locales of moment, which are loaded for what they do: each registers itself in moment (`import 'moment/locale/ja'`
// in src/app/shared/i18n/moment-locales.ts). moment ships them as JavaScript without type declarations, which
// TypeScript requires of an import made only for its effect.
declare module 'moment/locale/*';
