module.exports = {
  extends: ["airbnb", "prettier"],
  rules: {
    "no-param-reassign": "off",
    "class-methods-use-this": "off",
    "no-console": "off",
    curly: ["error", "all"],
  },
  env: {
    jest: true,
    browser: true,
    es6: true,
  },
};
