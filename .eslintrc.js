module.exports = {
  extends: ["airbnb", "prettier"],
  parserOptions: {
    // Override airbnb-config's ecmaVersion: 2018 so optional chaining
    // (used by gui.js / util.js) parses without errors.
    ecmaVersion: 2020,
  },
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
  globals: {
    BUNDLE_LEAFLET: "readonly",
  },
};
