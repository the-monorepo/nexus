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
    "expect": "writable"
  },
  "env": {
      "browser": true,
      "commonjs": true,
      "node": true,
      "es6": true,
      "mocha": true
  },
  "parserOptions": {
    "ecmaVersion": 9,
    "sourceType": "module",
    "ecmaFeatures": {
      "modules": true,
      "jsx": true
    }
  },
  "settings": {
    "import/extensions": [
      ".js",
      ".jsx",
      ".ts",
      ".tsx"
    ],
    "import/resolver": {
      "node": {
        "extensions": [
          ".js",
          ".jsx",
          ".ts",
          ".tsx"
        ]
      }
    }
  },
  rules: {
    ...commonRules,
  },
  "overrides": [{
    "files": ["./faultjs/fault-benchmarker/**"],
    "rules": {
      ...commonRules,
      "no-console": "off",
    }
  }, {
    "files": [ "**/examples/**" ],
    "rules": {
      ...commonRules,
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off"
    }
  }, {
    "files": ["**/test/**", "build-packages/**", "**/*.config.js", "**/gulpfile.js"],
    "rules": {
      ...commonRules,
      "@typescript-eslint/no-var-requires": "off"
    }
  }, {
    "files": ["misc/jest-mock-functions/**"],
    "env": {
      "jest": true
    },
    "rules": {
      ...commonRules,
    }
  }]
}