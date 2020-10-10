import * as cinder from 'cinder';
import { render, DomElement, UPDATE } from 'cinder';

import { autorun } from 'mobx';

import cx from 'classnames';

import * as d3 from 'd3';
import {
  scaleLinear,
  axisBottom,
  area,
  curveCatmullRom,
  extent,
  mean,
  axisLeft,
  select,
  group,
  rollup,
  scaleBand,
} from 'd3';

import * as previousStyles from './ViolinGraph.scss';
import * as figureStyles from './figure.scss';
import styles from './ViolinGraphElement.scss';

import { COLUMN, ROW, LayoutFlow } from './LayoutFlows';


const data2 = [
  { name: 'project-1', value: 0 },
  { name: 'project-1', value: 0.1 },
  { name: 'project-1', value: 0.12 },
  { name: 'project-1', value: 0.15 },
  { name: 'project-1', value: 0.18 },
  { name: 'project-1', value: 0.5 },
  { name: 'project-1', value: 0.5 },
  { name: 'project-1', value: 0.57 },
  { name: 'project-1', value: 0.9 },
  { name: 'project-1', value: 1 },
];

const data1 = [
  { name: 'project-1', value: 0 },
  { name: 'project-1', value: 0.1 },
  { name: 'project-1', value: 0.12 },
  { name: 'project-1', value: 0.10 },
  { name: 'project-1', value: 0 },
  { name: 'project-1', value: 0.5 },
  { name: 'project-1', value: 0.9 },
  { name: 'project-1', value: 0.9 },
  { name: 'project-1', value: 1 },
];

const dataMap = [
  { name: 'title', data: data1 },
  { name: 'otherstuff', data: data2 },
  { name: 'erawr', data: [{ name: 'rawr', value: 0 }, { name: 'hmm', value: 0.4}, { name: 'rawr', value: 0.7} ] },
];

const width = 400;
const height = 400;

const techniqueScale = scaleBand()
  .range([0, width])
  .domain(dataMap.map(({ name }) => name))
  .padding(0.05);

const examScale = scaleLinear().domain([0, 1]).range([0, height]);

const kernelEpanechnikov = (bandwidth: number) => {
  return (x: number) =>
    Math.abs((x /= bandwidth)) <= 1 ? (0.75 * (1 - x * x)) / bandwidth : 0;
};

const kde = (kernel: (x: number) => number, thresholds: number[], data: number[]) => {
  return thresholds.map((t) => [t, mean(data, (d) => kernel(t - d))]);
};

const nameToAreaValues = new Map(
  Object.values(dataMap)
    .map(
      ({ name, data }) => ([
        name,
        kde(
          kernelEpanechnikov(0.2),
          examScale.ticks(10),
          data.map(({ value }) => value),
        )
      ])
    )
);

class FaultJSViolinElement extends DomElement {
  [UPDATE]() {
    super[UPDATE]();
    select(this.renderRoot.getElementById('axis-left')).call(axisLeft(examScale));
    select(this.renderRoot.getElementById('axis-bottom')).call(
      axisBottom(techniqueScale),
    );

    const svgSelection = select(this.renderRoot.getElementById('svg'));
    for(const [name, areaValues] of nameToAreaValues) {
      const bandwidth = techniqueScale.bandwidth();
      const nameOffset = techniqueScale(name);

      const examDensityScale = scaleLinear()
        .domain([0, Math.max(...areaValues.map(d => d[1]))])
        .range([0, 1]);

      const violinArea = d3
        .area()
        .y((d) => examScale(d[0]))
        .x0((d) => (examDensityScale(d[1]) * bandwidth + bandwidth) / 2 + nameOffset)
        .x1((d) => (-examDensityScale(d[1]) * bandwidth + bandwidth) / 2 + nameOffset)
        .curve(curveCatmullRom);

      svgSelection
        .append('path')
        .attr('d', violinArea(areaValues))
    }
  }

  render() {
    return (
      <>
        <style>{styles.toString()}</style>
        <svg
          id="svg"
          class={styles.locals.svg}
          preserveAspectRatio="none"
          viewBox={`-25 -5 ${width + 25} ${height + 25}`}
        >
          <g id="axis-left" />
          <g id="axis-bottom" transform={`translate(0, ${height})`} />
        </svg>
      </>
    );
  }
}

customElements.define('faultjs-violin', FaultJSViolinElement);

export type SvgViolinProps = {
  className?: string;
  id?: string;
};

/**
 * The violin is horizontal
 */
const HorizontalSvgViolin = ({ class: className, id }: SvgViolinProps) => {
  const d = horizontalViolinArea([
    [0, 1],
    [0.1, 20],
    [0.3, 10],
    [0.4, 15],
    [0, 12],
    [0.45, 5],
    [0.5, 1],
    [1, 30],
  ]);

  const ar = axisBottom(x);
  console.log('???????', ar);

  return (
    <div class={previousStyles.violin}>
      <svg
        preserveAspectRatio="none"
        viewBox="0 -1 1 2"
        class={cx(previousStyles.svg, previousStyles.horizontal, className)}
        id={id}
      >
        <path d={d} />
      </svg>
    </div>
  );
};

const Label = ({ children }) => (
  <label class={cx(previousStyles.label)}>{children}</label>
);

export type ViolinGraphProps = {
  flow?: string;
  class?: string;
};
export const ViolinGraph = ({ flow = 'row', class: className }: ViolinGraphProps) => {
  const SvgViolinWithCorrectFlow = HorizontalSvgViolin;
  return (
    <>
      <figure class={cx(previousStyles.figure, previousStyles[flow], className)}>
        <figcaption class={figureStyles.caption}>EXAM score</figcaption>
        <Label>Test</Label>
        <div class={cx(figureStyles.scale, figureStyles.vertical)}></div>
        <SvgViolinWithCorrectFlow />
        <Label>Rawr</Label>
        <SvgViolinWithCorrectFlow />
        <Label>Asasaf</Label>
        <SvgViolinWithCorrectFlow />
        <div class={cx(figureStyles.scale, figureStyles.horizontal)}></div>
      </figure>
    </>
  );
};

<>
  <div class={cx(figureStyles.discreteScale, figureStyles.vertical)}></div>
  <div class={cx(figureStyles.discreteScale, figureStyles.horizontal)}></div>
</>;
