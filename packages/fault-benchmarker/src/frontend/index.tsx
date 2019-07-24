
/// <reference path="global.d.ts" />
import * as mbx from 'mobx-dom';
import benchmarkResults from '../../benchmark-results.json';
const algorithmNames = Object.keys(benchmarkResults.average);

type ProjectResult = {
  name: string;
  results: (number | undefined | null)[];
}
const projectResults: ProjectResult[] = benchmarkResults.projects.map(project => {
  const results: (number | undefined | null)[] = [];
  for (const algorithmName of algorithmNames) {
    results.push(project.results[algorithmName]);
  }
  return {
    name,
    results
  };
});

const TableHeader = () => (
  <div>
    {
      algorithmNames.map((algorithmName) => <div>{algorithmName}</div>)
    }
  </div>
);

const ProjectResult = (projectResult: ProjectResult) => (
  <div>
    <div>{projectResult.name}</div>
    {projectResult.results.map((result) => <div>{result}</div>)}
  </div>
)

const Main = () => (
  <div>
    <TableHeader/>
    {
      projectResults.map(ProjectResult)
    }
  </div>
);

mbx.render(<Main />, document.getElementById('root'));
