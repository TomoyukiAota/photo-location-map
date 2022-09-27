module.exports = {
  "root": true,
  "ignorePatterns": [
    "projects/**/*"
  ],
  "overrides": [
    {
      "files": [
        "*.ts"
      ],
      "parserOptions": {
        "project": [
          "tsconfig.json"
        ],
        "createDefaultProgram": true
      },
      "extends": [
        "plugin:@angular-eslint/recommended",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
      ],
      "rules": {
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
        "max-len": [
          "error",
          {
            "code": 200
          }
        ],
        "no-extra-boolean-cast": "off",
        "no-underscore-dangle": "off",

        // To enable "@typescript-eslint/semi", "semi" needs to be disabled as it can report incorrect errors.
        // See https://typescript-eslint.io/rules/semi/
        "semi": "off",
        "@typescript-eslint/semi": "error",
      }
    },
    {
      "files": [
        "*.html"
      ],
      "extends": [
        "plugin:@angular-eslint/template/recommended"
      ],
      "rules": {}
    }
  ]
}
