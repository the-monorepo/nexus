/// <reference path="global.d.ts" />
import './styles.css';
import * as mbx from 'mobx-dom';
import benchmarkResults from '../../benchmark-results.json';
type Result = number | undefined | null;
type ProjectResult = {
  name: string;
  min: number;
  max: number;
  results: Result[];
};
const algorithmNames = Object.keys(benchmarkResults.average);
const projectResults: ProjectResult[] = benchmarkResults.projects.map(project => {
  const results: Result[] = [];
  for (const algorithmName of algorithmNames) {
    results.push(project.results[algorithmName]);
  }
  const max = Math.max(...(results.filter(a => a != null) as number[]));
  const min = Math.min(...(results.filter(a => a != null) as number[]));
  return {
    name: project.name,
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

const ProjectResult = (project: ProjectResult) => {
  const range = project.max - project.min;
  return (
    <tr>
      <td>
        <p>{project.name}</p>
      </td>
      {project.results.map(result => {
        const colorWeight =
          range === 0 ? 0 : ((result != null ? result : 0) - project.min) / range;
        const offset = 120;
        const factor = 255 - offset - 10;
        const red = offset + factor * Math.min(1, colorWeight);
        const green = offset + factor * Math.max(0, 1 - colorWeight);
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

const averageResults: number[] = Object.values(benchmarkResults.average).map(result =>
  result != null ? result : 0,
) as number[];
const averageMin = Math.min(...averageResults);
const averageMax = Math.max(...averageResults);
const state = {
  separateSandboxed: false,
};
const Main = () => (
  <div className="page">
    <header className="page-title">
      <h1>Fault.js benchmark results</h1>
    </header>
    <input
      type="checkbox"
      name="separate-sandboxed"
      $$click={e => {
        state.separateSandboxed = e.target.checked;
        rerender();
      }}
      checked
    >
      <label htmlFor="separate-sandboxed">Separate sandboxed</label>
    </input>
    <table className="table">
      <tbody>
        <TableHeader />
        {projectResults.map(ProjectResult)}
        <ProjectResult
          name="Average"
          min={averageMin}
          max={averageMax}
          results={averageResults}
        />
      </tbody>
    </table>
  </div>
);

const rerender = () => mbx.render(<Main />, document.getElementById('root'));
rerender();
