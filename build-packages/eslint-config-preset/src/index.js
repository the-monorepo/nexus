module.exports = {
  plugins: [
    //'@typescript-eslint/eslint-plugin',
    'eslint-plugin-import',
    //'eslint-plugin-react',
  ],
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    //'plugin:react/recommended',
    //'plugin:@typescript-eslint/eslint-recommended',
    //'plugin:@typescript-eslint/recommended',
    '@pshaw/eslint-config-core',
    '@pshaw/eslint-config-plugin-react',
    //'@pshaw/eslint-config-plugin-typescript',
    '@pshaw/eslint-config-plugin-import',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
  ],
  rules: {
    'no-console': 'warn',
  },
};
