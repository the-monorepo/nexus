const config = require('@monorepo/config');

const commonRules = {
  'react/react-in-jsx-scope': 'off',
  "react/jsx-key": 'off'
}

module.exports = {
  "parser": "@typescript-eslint/parser",
  "extends": [
    "@pshaw/eslint-config-preset"
  ],
  "globals": {
    "expect": "readable",
    "globalThis": "readable",
  },
  "env": {
      "browser": true,
      "commonjs": true,
      "node": true,
      "es6": true,
      "mocha": true,
  },
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module",
    "ecmaFeatures": {
      "modules": true,
      "jsx": true,
    }
  },
  "settings": {
    "import/resolver": {
      "node": {
        "extensions": config.codeExtensions.map(extension => `.${extension}`),
      }
    }
  },
  rules: {
    ...commonRules,
  },
  "overrides": [{
    "files": ["./packages/faultjs/javascript/**", './packages/fl-benchmarker/javascript/**'],
    "rules": {
      ...commonRules,
      "no-console": "off",
    }
  }, {
    "files": [ "**/{file-examples,examples,standalone-examples}/**" ],
    "rules": {
      ...commonRules,
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off"
    }
  }, {
    "files": ["**/test/**", "packages/build-packages/javascript/**", "**/*.config.js", '.eslintrc.cjs'],
    "rules": {
      ...commonRules,
      "@typescript-eslint/no-var-requires": "off"
    }
  }, {
    "files": ["packages/misc/javascript/jest-mock-functions/**"],
    "env": {
      "jest": true
    },
    "rules": {
      ...commonRules,
    }
  }]
}
