import * as cinder from 'cinder';
import { render, DomElement, UPDATE } from 'cinder';

import { autorun } from 'mobx';

import cx from 'classnames';

import * as d3 from 'd3';
import { scaleLinear, axisBottom, area, curveCatmullRom, extent, mean, axisLeft, select, nest } from 'd3';

import * as previousStyles from './ViolinGraph.scss';
import * as figureStyles from './figure.scss';
import styles from './ViolinGraphElement.scss';

import { COLUMN, ROW, LayoutFlow } from './LayoutFlows';

function kernelDensityEstimator(kernel, X) {
  return (V) => {
    return X.map((x) => {
      return [x, mean(V, (v) => kernel(x - v))];
    });
  };
};

const data2 = [0, 0.1, 0.12, 0.15, 0.18, 0.5, 0.57, 0.9, 1];
const data = [0, 0.1, 0.12, 0.15, 0.18, 0.5, 0.57, 0.9, 1];

const dataMap = {
  'mbfl': data,
  'otherstuff': data2,
};
const width = 400;
const height = 400;

const categoryScale = scaleBand()
  .range([0, width]);

const examScale = scaleLinear()
  .domain([0, 1])
  .range([0, height])

const kernelEpanechnikov = (bandwidth) => {
  return x => Math.abs(x /= bandwidth) <= 1 ? 0.75 * (1 - x * x) / bandwidth : 0;
};

const kde = (kernel, thresholds, data) => {
  return thresholds.map(t => [t, mean(data, d => kernel(t - d))]);
}

const examDensity = kde(kernelEpanechnikov(0.2), examScale.ticks(1000), data)

const examDensityScale = scaleLinear()
  .domain([0, d3.max(examDensity, d => d[1])])
  .range([0, width])

console.log(examDensity);

const horizontalViolinArea = d3.area()
  .y(d => examScale(d[0]))
  .x0(d => (examDensityScale(d[1]) + width) / 2)
  .x1(d => (-examDensityScale(d[1]) + width) / 2)
  .curve(curveCatmullRom);

class FaultJSViolinElement extends DomElement {
  [UPDATE]() {
    super[UPDATE]();
    select(this.renderRoot.getElementById('violin-path'))
      .datum(examDensity)
      .attr('d', horizontalViolinArea);
    select(this.renderRoot.getElementById('axis-left'))
      .append('g')
      .call(axisLeft(examScale))
    select(this.renderRoot.getElementById('axis-bottom'))
      .append('g')
      .call(axisBottom(examDensityScale));
  }

  render() {
    return (
      <>
        <style>
          {styles.toString()}
        </style>
        <svg class={styles.locals.svg} preserveAspectRatio="none" viewBox={`-25 -5 ${width + 25} ${height + 25}`}>
          <path id="violin-path" />
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
  const d = horizontalViolinArea([[0, 1], [0.1, 20], [0.3, 10], [0.4, 15], [0.45, 5], [0.5, 1], [1, 30]]);

  const ar = axisBottom(x);
  console.log('???????', ar);

  return (
    <div class={previousStyles.violin}>
      <svg preserveAspectRatio="none" viewBox='0 -1 1 2' class={cx(previousStyles.svg, previousStyles.horizontal, className)} id={id}>
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

</>
