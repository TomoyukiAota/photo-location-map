import js from '@eslint/js';
import angular from '@angular-eslint/eslint-plugin';
import angularConfigs from 'angular-eslint';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import stylistic from '@stylistic/eslint-plugin';

// Preserve the existing rules and NgModule architecture.
// The migration to signals, OnPush and zoneless Angular (docs/tasks/20261107_angular-signals-zoneless/PLAN.md)
// turns rules on as its stages finish: @angular-eslint/no-uncalled-signals at the end of stage 1, together with the
// typed linting it needs (projectService below); @angular-eslint/prefer-signals and
// prefer-on-push-component-change-detection at the end of stage 2; prefer-inject, prefer-service-decorator and
// prefer-standalone in stage 4, each with its migration.
const existingRules = {
  "@angular-eslint/prefer-standalone": "off", // Until stage 4 of the migration above.
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
    },
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
