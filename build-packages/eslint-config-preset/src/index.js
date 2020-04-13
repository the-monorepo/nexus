module.exports = {
  extends: [
    "@pshaw/eslint-config-core",
    "@pshaw/eslint-config-plugin-react",
    "@pshaw/eslint-config-plugin-typescript",
    "@pshaw/eslint-config-plugin-import",
    "prettier",
    "prettier/@typescript-eslint"
  ],
  rules: {
    "no-console": "warn",
  },
};
