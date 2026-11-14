import js from '@eslint/js';
import angular from '@angular-eslint/eslint-plugin';
import angularConfigs from 'angular-eslint';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import stylistic from '@stylistic/eslint-plugin';

// Preserve the existing rules.
// The migration to signals, OnPush and zoneless Angular (docs/tasks/20261107_angular-signals-zoneless/PLAN.md)
// turns rules on as its stages finish: @angular-eslint/no-uncalled-signals at the end of stage 1, together with the
// typed linting it needs (projectService below); @angular-eslint/prefer-signals and
// prefer-on-push-component-change-detection at the end of stage 2; prefer-inject, prefer-service-decorator and
// prefer-standalone in stage 4, each with its migration.
const existingRules = {
  "@angular-eslint/component-selector": [
    "error",
    {
      "type": "element",
      "prefix": "app",
      "style": "kebab-case"
    }
  ],
  "@typescript-eslint/consistent-type-definitions": "error",
  "@typescript-eslint/dot-notation": "off",
  "@typescript-eslint/explicit-member-accessibility": [
    "off",
    {
      "accessibility": "explicit"
    }
  ],
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/member-ordering": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      "args": "none"
    }
  ],
  "brace-style": "off",
  "curly": "off",
  "id-blacklist": "off",
  "id-match": "off",
  "no-extra-boolean-cast": "off",
  "no-underscore-dangle": "off",
  // ESLint 10 adds recommended checks; retain the existing lint policy.
  "no-unassigned-vars": "off",
  "no-useless-assignment": "off",
  "preserve-caught-error": "off",
  "@stylistic/semi": "error",
  "@stylistic/quotes": [
    "error",
    "single",
    {
      "avoidEscape": true,
      "allowTemplateLiterals": "always"
    }
  ],
  // inject() rather than constructor parameters, as Angular's style guide recommends.
  "@angular-eslint/prefer-inject": "error",
  // @Service() rather than @Injectable({ providedIn: 'root' }), as Angular's best practices recommend from Angular 22.
  "@angular-eslint/prefer-service-decorator": "error",
  // `if (signal)` tests the function, which is always there, rather than its value. Needs type information.
  "@angular-eslint/no-uncalled-signals": "error",
  // Signal inputs and queries rather than @Input and @ViewChild, and signal properties that are readonly.
  "@angular-eslint/prefer-signals": "error",
  "@stylistic/max-len": [
    "error",
    {
      "code": 200
    }
  ]
};

// TL;DR: A logged error or warning with values is written with the tag `logged`.
// Details: Logger.error and Logger.warn record their lines for analytics, and a line's values can name the user's
// files, which no scrubbing can tell by their form. Only the tag says which values may be recorded
// (src-shared/log/logged-line.ts). Any logger's error() and warn() are checked: a logger is named "logger" or
// "…Logger".
const loggedLineMessage = 'Write a logged error or warning that has values with the tag `logged` '
  + '(src-shared/log/logged-line.ts), so that no value that could name the user\'s files is recorded.';
const loggerCall = 'CallExpression[callee.property.name=/^(error|warn)$/][callee.object.name=/(^l|L)ogger$/]';
const loggedLineRule = ['error',
  { selector: `${loggerCall} > TemplateLiteral:first-child[expressions.length>0]`, message: loggedLineMessage },
  { selector: `${loggerCall} > BinaryExpression:first-child[operator='+']`, message: loggedLineMessage },
];

export default [
  { ignores: ['projects/**', 'dist/**', 'release/**', '.upgrade-artifacts/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      // Type information for the rules that need it. Each file gets it from the nearest tsconfig.json, the root one.
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module', projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { '@angular-eslint': angular, '@typescript-eslint': tsPlugin, '@stylistic': stylistic },
    rules: {
      ...Object.assign({}, ...angularConfigs.configs.tsRecommended.map(config => config.rules)),
      ...js.configs.recommended.rules,
      ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
      ...existingRules,
      'no-restricted-syntax': loggedLineRule,
    },
  },
  {
    // The main process, and the code that it shares with the renderer: checked for the form of its imports so far.
    // TL;DR: A module is loaded by an import: these files run as ES modules, which have no require().
    // Details: tsc accepts a call of require(), which the types of Node declare everywhere, and it would fail only once
    // it runs. A module that is loaded late, or that may be missing, is loaded with import()
    // (docs/contributing/module-formats.md).
    files: ['src-main/**/*.ts', 'src-shared/**/*.ts'],
    // These files have comments that switch off rules which are not checked here: they are not reported as unused.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: { '@typescript-eslint/no-require-imports': 'error', 'no-restricted-syntax': loggedLineRule },
  },
  {
    // Loggers that record nothing, so whose lines need no tag: the thumbnail worker's own, which writes to its console
    // only (its failures are recorded by reason, src-main/thumbnail-generation/thumbnail-failures.ts), and the
    // analytics code's, made with { recorded: false } so as not to record the analytics' own failures to send.
    files: [
      'src-main/thumbnail-generation/generate-thumbnail-file-worker.ts',
      'src-shared/analytics/library-wrapper/**/*.ts',
      'src-shared/analytics/analytics-backend/**/*.ts',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { '@angular-eslint/template': angularTemplate },
    rules: {
      ...Object.assign({}, ...angularConfigs.configs.templateRecommended.map(config => config.rules)),
      // [class.name] bindings rather than [ngClass], as Angular's best practices recommend.
      '@angular-eslint/template/prefer-class-binding': 'error',
    },
  },
];
