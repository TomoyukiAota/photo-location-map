import js from '@eslint/js';
import angular from '@angular-eslint/eslint-plugin';
import angularConfigs from 'angular-eslint';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import stylistic from '@stylistic/eslint-plugin';

// Preserve the existing rules and NgModule/constructor-injection architecture.
const existingRules = {
  "@angular-eslint/prefer-standalone": "off",
  "@angular-eslint/prefer-on-push-component-change-detection": "off",
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
  "@stylistic/semi": "error",
  "@stylistic/quotes": [
    "error",
    "single",
    {
      "avoidEscape": true,
      "allowTemplateLiterals": true
    }
  ],
  "@angular-eslint/prefer-inject": "off",
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
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
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
    rules: Object.assign({}, ...angularConfigs.configs.templateRecommended.map(config => config.rules)),
  },
];
