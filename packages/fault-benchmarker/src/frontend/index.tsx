/// <reference path="global.d.ts" />
import './styles.css';
import * as mbx from 'mobx-dom';
import benchmarkResults from '../../benchmark-results.json';
type Ranking = {
  rank: number,
  count: number,
};
type Result = {
  exam: number | undefined | null,
  rankings: number[]
};
type ProjectResult = {
  name: string,
  artificial: boolean,
  min: number,
  max: number,
  results: Result[],
};
const algorithmNames = Object.keys(benchmarkResults.average);
const projectResults: ProjectResult[] = benchmarkResults.projects.map((project): ProjectResult => {
  const results: Result[] = [];
  for (const algorithmName of algorithmNames) {
    results.push(project.results[algorithmName]);
  }
  const max = Math.max(...(results.filter(a => a != null).map(a => a.exam) as number[]));
  const min = Math.min(...(results.filter(a => a != null).map(a => a.exam) as number[]));
  return {
    name: project.name,
    artificial: project.artificial,
    max: Number.isNaN(max) ? 1 : max,
    min: Number.isNaN(min) ? 1 : min,
    results,
  };
});

const TableHeader = () => (
  <tr>
    <td></td>
    {algorithmNames.map(algorithmName => (
      <td>
        <p>{algorithmName}</p>
      </td>
    ))}
  </tr>
);

type ProjectResultProps = {
  name: string,
  min: number,
  max: number,
  results: (number | undefined | null)[],
  invertColors: boolean
};
const ProjectResult = (project: ProjectResultProps) => {
  const range = project.max - project.min;
  return (
    <tr>
      <td>
        <p>{project.name}</p>
      </td>
      {project.results.map(result => {
        const colorWeight =
          range === 0 ? 0 : ((result != null ? result : 0) - project.min) / range;
        const invertColorWeight = project.invertColors ? 1 - colorWeight : colorWeight;
        const offset = 120;
        const factor = 255 - offset - 10;
        const red = offset + factor * Math.min(1, invertColorWeight);
        const green = offset + factor * Math.max(0, 1 - invertColorWeight);
        const blue = offset * 0.8;
        return (
          <td style={`background-color: rgb(${red}, ${green}, ${blue});`}>
            <p>{result != null ? Math.round(result * 1000) / 1000 : 'unknown'}</p>
          </td>
        );
      })}
    </tr>
  );
};

type ResultsTableProps = {
  projectResults: ProjectResultProps[],
  invertColors: boolean,
};
export const ResultsTable = ({ projectResults, invertColors }: ResultsTableProps) => {
  const averages: number[] = [];
  for(let i = 0; i < algorithmNames.length; i++) {  
    let sum = 0;
    let count = 0;
    for(const projectResult of projectResults) {
      const result = projectResult.results[i];
      if (result != null) {
        sum += result;
        count++;        
      }
    }
    averages.push(count !== 0 ? sum / count : 0);
  }
  const averageMin = Math.min(...averages);
  const averageMax = Math.max(...averages);
  
  return (
  <table className="table">
  <tbody>
    <TableHeader />
    {projectResults.map(result => (
      <ProjectResult
        invertColors={invertColors}
        name={result.name}
        min={result.min}
        max={result.max}
        results={result.results.map(item => item)}
      />
    ))}
    <ProjectResult
      invertColors={invertColors}
      name='Average'
      min={averageMin}
      max={averageMax}
      results={averages}
    />
  </tbody>
  </table>
  );
};

const state = {
  separateArtificial: true,
};

const projectResultsToExamResults = (projectResults: ProjectResult[]): ResultsTableProps => {
  const tableProps = projectResults.map(projectResult => ({
    ...projectResult,
    results: projectResult.results.map(result => result.exam)
  }));

  const averages: number[] = [];
  for(let i = 0 ; i < algorithmNames.length; i++) {
    let sum = 0;
    let count = 0;
    for(const projectResult of projectResults) {
      const exam = projectResult.results[i].exam;
      if (exam != null) {
        sum += exam;
        count++;
      } 
    }
    if (count !== 0) {
      averages.push(sum / count);
    } else {
      averages.push(0);
    }
  }

  return {
    projectResults: tableProps,
    invertColors: false,
  }
};

const projectResultsToRankings = (projectResults: ProjectResult[]): ResultsTableProps => {
  const props: ProjectResultProps[] =[];

  for(const ranking of [1, 3, 5, 10, 100]) {
    const algoRankings: number[] = algorithmNames.map((algorithmName, i) => {
      let count = 0;
      for(const projectResult of projectResults) {
        const rankings = projectResult.results[i].rankings;
        for(const rank of rankings) {
          if (rank < ranking) {
            count++;
          }
        }
      }
      return count;
    });

    const rankingMin = Math.min(...algoRankings);
    const rankingMax = Math.max(...algoRankings);

    props.push({
      name: ranking.toString(),
      min: rankingMin,
      max: rankingMax,
      results: algoRankings,
    });
  }

  return {
    projectResults: props,
    invertColors: true,
  };
};

const Main = () => {
  const tableResults: ResultsTableProps[] = [];
  console.log(projectResults)
  if (state.separateArtificial) {
    tableResults.push(projectResultsToExamResults(projectResults.filter(projectResult => !projectResult.artificial)));
    tableResults.push(projectResultsToExamResults(projectResults.filter(projectResult => projectResult.artificial)));
    tableResults.push(projectResultsToRankings(projectResults.filter(projectResults => !projectResults.artificial)));
    tableResults.push(projectResultsToRankings(projectResults.filter(projectResults => projectResults.artificial)));
  } else {
    tableResults.push(projectResultsToExamResults(projectResults));
    tableResults.push(projectResultsToRankings(projectResults));
  }
  // TODO: JSX comments aren't working
  // TODO: JSX spread not working
  // TODO: JSX boolean (without explicitly saying XXX={true}) doesn't works
  return (
  <div className="page">
    <header className="page-title">
      <h1>Fault.js benchmark results</h1>
    </header>
    <label htmlFor="separate-sandboxed">Separate sandboxed</label>
    <input
      type="checkbox"
      name="separate-sandboxed"
      $$change={e => {
        state.separateArtificial = e.target.checked;
        rerender();
      }}
      checked={true}
    >
    </input>
    {
      tableResults.map(tableResult => (
        <ResultsTable
          projectResults={tableResult.projectResults}
          invertColors={tableResult.invertColors}
        />  
      ))
    }
  </div>
  );
};


const rerender = () => mbx.render(<Main />, document.getElementById('root'));
rerender();
