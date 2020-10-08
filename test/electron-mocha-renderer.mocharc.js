module.exports = {
  'require': [
    './test/electron-mocha-renderer.hooks.js',
    'espower-typescript/guess'
  ],
  spec: 'test/**/*.spec.em.@(renderer|both).ts',
};
