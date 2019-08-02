export type ProjectConfig = {
  // Setup files to use (E.g. Babel register to transpile files)
  setupFiles?: string[];
  // Name of the project
  testMatch?: string | string[];
  env?: { [s: string]: any },
  sandbox?: boolean;
  artificial?: boolean;
  tester?: string;
};

export type GlobbedConfig = {
  glob: string | string[];
} & ProjectConfig;

export type BenchmarkConfig = GlobbedConfig[];

export const config: BenchmarkConfig = [
  {
    glob: 'sinon-*',
    testMatch: './test/**/*-test.js',
    sandbox: true,
  },
  {
    glob: 'quixbugs-*',
    sandbox: true,
    artificial: true,
  },
  {
    glob: 'node-convict-*',
    testMatch: './test/*-tests.js',
    sandbox: true,
  },
  {
    glob: 'chai-*',
    testMatch: './test/*.js',
    setupFiles: ['./babel', './test/bootstrap'],
    sandbox: false,
    env: {
      ...process.env,
      NODE_ENV: 'test'
    },  
  }
];

export default config;