module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  rules: {
    semi: ['error', 'always']
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'standard'
};
