import { createCoverageMap } from 'istanbul-lib-coverage';
import { createContext } from 'istanbul-lib-report';
import { create } from 'istanbul-reports';

import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import { FinalTesterResults } from '@fault/types';

export const report = ({ coverage }: FinalTesterResults, contextOptions) => {
  const coverageMap = createCoverageMap(coverage);

  const context = createContext({
    ...contextOptions,
    coverageMap,
  });

  for (const reportType of ['text', 'json', 'lcov']) {
    const report = create(reportType);

    report.execute(context);
  }
};

export const createPlugin = (contextOptions) => {
  const plugin: PartialTestHookOptions = {
    on: {
      complete: (testerResults: FinalTesterResults) => {
        report(testerResults, contextOptions);
      },
    },
  };
  return plugin;
};
export const defaultPlugin = createPlugin();

export default defaultPlugin;
