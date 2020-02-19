module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": ["eslint:recommended"],
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "script"
  },
  "rules": {
    "indent": [
      "error",
      2,
      { "SwitchCase": 1 }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double",
      { "allowTemplateLiterals": true }
    ],
    "semi": [
      "error",
      "always"
    ],
    "no-unused-vars": [
      "error",
      { "varsIgnorePattern": "^_" }
    ],
    "no-empty": [
      "error",
      { "allowEmptyCatch": true }
    ],
    "sort-keys": "error",
    "consistent-return": "error",
    "dot-notation": "error",
    "no-array-constructor": "error",
    "no-caller": "error",
    "no-dupe-keys": "error",
    "no-else-return": "error",
    "no-eval": "error",
    "no-extra-bind": "error",
    "no-fallthrough": [
      "error",
      { commentPattern: "FALLTHROUGH" },
    ],
    "no-global-assign": "error",
    "no-implied-eval": "error",
    "no-inner-declarations": "off",
    "no-iterator": "error",
    "no-labels": "error",
    "no-lone-blocks": "error",
    "no-lonely-if": "error",
    "no-nested-ternary": "error",
    "no-new-object": "error",
    "no-restricted-globals": ["error", "event"],
    "no-return-await": "error",
    "no-self-compare": "error",
    "no-sequences": "error",
    "no-shadow-restricted-names": "error",
    "no-throw-literal": "error",
    "no-unneeded-ternary": "error",
    "no-useless-call": "error",
    "no-useless-concat": "error",
    "no-useless-return": "error",
    "no-with": "error",
    "object-shorthand": ["error", "always", { "avoidQuotes": true }],
    "no-constant-condition": ["error", { "checkLoops": false }],
  }
};
