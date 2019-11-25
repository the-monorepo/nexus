/// <reference path="global.d.ts" />
import * as mbx from 'mobx-dom';
import benchmarkResults from '../../benchmark-results.json';
type Ranking = {
  rank: number;
  count: number;
};
type Result = {
  exam: number | undefined | null;
  rankings: number[];
};
type ProjectResult = {
  name: string;
  artificial: boolean;
  min: number;
  max: number;
  results: Result[];
};
const algorithmNames = Object.keys(benchmarkResults.average);
const projectResults: ProjectResult[] = benchmarkResults.projects.map(
  (project): ProjectResult => {
    const results: Result[] = [];
    for (const algorithmName of algorithmNames) {
      results.push(project.results[algorithmName]);
    }
    const max = Math.max(
      ...(results.filter(a => a != null).map(a => a.exam) as number[]),
    );
    const min = Math.min(
      ...(results.filter(a => a != null).map(a => a.exam) as number[]),
    );
    return {
      name: project.name,
      artificial: project.artificial,
      max: Number.isNaN(max) ? 1 : max,
      min: Number.isNaN(min) ? 1 : min,
      results,
    };
  },
);

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
  name: string;
  min: number;
  max: number;
  results: (number | undefined | null)[];
  invertColors: boolean;
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
            <p>
              {result != null ? Math.round(result * 1000) / 1000 : 'unknown'}
              {project.total ? ` (${Math.round((result / project.total) * 100)}%)` : ''}
            </p>
          </td>
        );
      })}
    </tr>
  );
};

type PercentageData = {};
type ResultsTableProps = {
  projectResults: ProjectResultProps[];
  // TODO: Kind of hacked, refactor
  invertColors: boolean;
  total?: number;
  title: string;
};
const ResultsTable = ({
  projectResults,
  invertColors,
  total,
}: ResultsTableProps) => {
  const averages: number[] = [];
  for (let i = 0; i < algorithmNames.length; i++) {
    let sum = 0;
    let count = 0;
    for (const projectResult of projectResults) {
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
            total={total}
            results={result.results.map(item => item)}
          />
        ))}
        <ProjectResult
          invertColors={invertColors}
          name="Average"
          min={averageMin}
          max={averageMax}
          total={total}
          results={averages}
        />
      </tbody>
    </table>
  );
};

const state = {
  separateArtificial: true,
};

const projectResultsToExamResults = (
  projectResults: ProjectResult[],
  title: string,
  clazz?: string,
): ResultsTableProps => {
  const tableProps = projectResults.map(projectResult => ({
    ...projectResult,
    results: projectResult.results.map(result => (result ? result.exam : 1)),
  }));

  const averages: number[] = [];
  for (let i = 0; i < algorithmNames.length; i++) {
    let sum = 0;
    let count = 0;
    for (const projectResult of projectResults) {
      if (projectResult.results[i] != null) {
        const exam = projectResult.results[i].exam;
        if (exam != null) {
          sum += exam;
          count++;
        }
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
    title,
    class: clazz,
  };
};

const projectResultsToRankings = (
  projectResults: ProjectResult[],
  title: string,
  clazz?: string,
): ResultsTableProps => {
  const props: ProjectResultProps[] = [];

  let totalRanks = 0;
  for (const projectResult of projectResults) {
    totalRanks += Math.max(
      ...projectResult.results.map(result => (result ? result.rankings.length : 0)),
    );
  }
  for (const ranking of [1, 3, 5, 10, 100]) {
    const algoRankings: number[] = algorithmNames.map((algorithmName, i) => {
      let count = 0;
      for (const projectResult of projectResults) {
        if (projectResult.results[i] == null) {
          continue;
        }
        const rankings = projectResult.results[i].rankings;
        for (const rank of rankings) {
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
  console.log(totalRanks);
  return {
    projectResults: props,
    invertColors: true,
    total: totalRanks,
    title,
    clazz,
  };
};

const Main = () => {
  const eInspectResults: ResultsTableProps[] = [];
  const examResults: ResultsTableProps[] = [];
  console.log(projectResults);
  if (state.separateArtificial) {
    examResults.push(
      projectResultsToExamResults(
        projectResults.filter(projectResult => !projectResult.artificial),
        'Real-world EXAM scores',
        'big',
      ),
    );
    examResults.push(
      projectResultsToExamResults(
        projectResults.filter(projectResult => projectResult.artificial),
        'Artificial EXAM scores',
      ),
    );
    eInspectResults.push(
      projectResultsToRankings(
        projectResults.filter(projectResults => !projectResults.artificial),
        'Real-world Einspect@n scores',
      ),
    );
    eInspectResults.push(
      projectResultsToRankings(
        projectResults.filter(projectResults => projectResults.artificial),
        'Artificial Einspect@n scores',
      ),
    );
  } else {
    examResults.push(projectResultsToExamResults(projectResults, 'Exam scores'));
    eInspectResults.push(projectResultsToRankings(projectResults, 'Einspect@n scores'));
  }
  const tableResults: ResultsTableProps[] = [];
  // TODO: JSX comments aren't working
  // TODO: JSX spread not working
  // TODO: JSX boolean (without explicitly saying XXX={true}) doesn't works
  return (
    <div>
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
      ></input>
      <div className="page">
        {tableResults.map(tableResult => (
          <section className={tableResult.class}>
            <h2>{tableResult.title}</h2>
            <ResultsTable
              projectResults={tableResult.projectResults}
              invertColors={tableResult.invertColors}
              total={tableResult.total}
            />
          </section>
        ))}
      </div>
    </div>
  );
};

const rerender = () => mbx.render(<Main />, document.getElementById('root'));
rerender();
