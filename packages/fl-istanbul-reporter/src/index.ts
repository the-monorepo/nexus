import { createContext, summarizers } from 'istanbul-lib-report';
import { create } from 'istanbul-reports';
import { createCoverageMap } from 'istanbul-lib-coverage';
export const report = ({ testResults, suiteResults }) => {
  const totalCoverage = createCoverageMap({});
  for(const { coverage } of testResults) {
    totalCoverage.merge(coverage);
  }
  const context = createContext();
  
  const tree = summarizers.pkg(totalCoverage);
  ['json', 'lcov', 'text'].forEach(reporter =>
    tree.visit(create(reporter as any, {}), context)
  );
};
