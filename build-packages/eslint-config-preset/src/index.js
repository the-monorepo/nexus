const commonExtendsPart1 = [
  'eslint:recommended',
  'plugin:import/errors',
  'plugin:import/typescript',
  'plugin:react/recommended',
  'plugin:@typescript-eslint/eslint-recommended',
  'plugin:@typescript-eslint/recommended',
  '@pshaw/eslint-config-core',
];

const commonExtendsPart2 = [
  '@pshaw/eslint-config-plugin-typescript',
  '@pshaw/eslint-config-plugin-import',
  'prettier',
  'prettier/@typescript-eslint',
  'prettier/react',  
];

const cinderExtends = [
  '@pshaw/eslint-config-plugin-cinder',
];

const reactExtends = [
  '@pshaw/eslint-config-plugin-react',
];

const commonPlugins = [
  '@typescript-eslint/eslint-plugin',
  'eslint-plugin-import',
  'eslint-plugin-react',
]

const cinderConfig = {
  files: ['*.{ts,tsx,js,jsx}'],
  plugins: [
    ...commonPlugins,
  ],
  extends: [
    ...commonExtendsPart1,
    ...cinderExtends,
    ...commonExtendsPart2,
  ]
};

const reactConfig = {
  files: ['*.react.{ts,tsx,js,jsx}'],
  plugins: [
    ...commonPlugins,
  ],
  extends: [
    ...commonExtendsPart1,
    ...reactExtends,
    ...commonExtendsPart2,
  ],
};

module.exports = {
  overrides: [
    cinderConfig,
    reactConfig,
  ]
};
