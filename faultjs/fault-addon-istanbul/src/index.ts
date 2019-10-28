import { createContext, summarizers } from 'istanbul-lib-report';
import { create } from 'istanbul-reports';
import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import { FinalTesterResults } from '@fault/types';
import { createCoverageMap } from 'istanbul-lib-coverage';

export const report = ({ coverage }: FinalTesterResults, contextOptions) => {
  const coverageMap = createCoverageMap(coverage);
  const context = createContext(contextOptions);

  const tree = summarizers.pkg(coverageMap);
  ['json', 'lcov', 'text'].forEach(reporter =>
    tree.visit(create(reporter as any, {}), context),
  );
};

export const createPlugin = contextOptions => {
  const plugin: PartialTestHookOptions = {
    on: {
      complete: (testerResults: FinalTesterResults) => {
        report(testerResults, contextOptions);
      },
    },
  };
  return plugin;
};
export const defaultPlugin = createPlugin(undefined);

export default defaultPlugin;
