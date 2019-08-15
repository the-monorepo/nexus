import { resolve } from 'path';
export type ProjectConfig = {
  // Setup files to use (E.g. Babel register to transpile files)
  setupFiles?: string[];
  // Name of the project
  testMatch?: string | string[];
  env?: { [s: string]: any };
  artificial?: boolean;
  tester?: string;
  testOptions?: {
    [s: string]: any;
  };
};

export type GlobbedConfig = {
  glob: string | string[];
} & ProjectConfig;

export type BenchmarkConfig = GlobbedConfig[];

export const config: BenchmarkConfig = [
  {
    glob: 'sinon-*',
    testMatch: './test/**/*-test.js',
    testOptions: {
      sandbox: true,
    },
  },
  {
    glob: 'quixbugs-*',
    testOptions: {
      sandbox: true,
    },
    artificial: true,
  },
  {
    glob: 'node-convict-*',
    testMatch: './test/*-tests.js',
    testOptions: {
      sandbox: true,
    },
  },
  {
    glob: 'chai-*',
    testMatch: './test/*.js',
    testOptions: {
      sandbox: false,
      require: ['./test/bootstrap'],
    },
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  },
  {
    glob: 'yargs-*',
    testMatch: './test/*.js',
    testOptions: {
      require: ['./test/before'],
      sandbox: false,
    }
  },
];

export default config;
