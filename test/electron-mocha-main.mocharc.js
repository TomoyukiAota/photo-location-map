module.exports = {
  'require': [
    './test/electron-mocha-main.hooks.js',
    'espower-typescript/guess'
  ],
  spec: 'test/**/*.spec.em.@(main|both).ts',
};
