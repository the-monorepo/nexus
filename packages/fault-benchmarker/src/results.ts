import { readFile, readdir, writeFile } from 'mz/fs';
import globby from 'globby';
import { resolve, basename } from 'path';

type ProjectResult = {
  name: string;
  results: {
    [s: string]: number;
  };
};

export const run = async () => {
  const projectDirs = await globby('./projects/*', {
    expandDirectories: false,
    onlyDirectories: true,
  });
  const projectResults: ProjectResult[] = [];
  for (const projectDir of projectDirs) {
    const packageJson = require(resolve(projectDir, 'package.json'));
    projectResults.push({
      name: packageJson.name,
      results: require(resolve(projectDir, 'fault-results.json')),
    });
  }

  const algorithmNames: Set<string> = new Set();
  for (const projectResult of projectResults) {
    for (const algorithmName of Object.keys(projectResult.results)) {
      algorithmNames.add(algorithmName);
    }
  }

  const initialAverageResult = [...algorithmNames].reduce((obj, algorithmName) => {
    obj[algorithmName] = 0;
    return obj;
  }, {});

  const averageResults = projectResults.reduce((currentSum, projectResult) => {
    for (const algorithmName of Object.keys(projectResult.results)) {
      currentSum[algorithmName] += projectResult.results[algorithmName];
    }
    return currentSum;
  }, initialAverageResult);

  for (const algorithmName of Object.keys(averageResults)) {
    averageResults[algorithmName] /= projectResults.length;
  }

  const finalResults = {
    average: averageResults,
    projects: projectResults,
  };

  await writeFile(
    './benchmark-results.json',
    JSON.stringify(finalResults, undefined, 2),
    'utf8',
  );
};
run().catch(console.error);
