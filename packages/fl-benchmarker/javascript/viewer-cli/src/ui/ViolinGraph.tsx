import * as cinder from 'cinder';
import { DomElement, UPDATE, MOUNT, UNMOUNT } from 'cinder';

import { observable, action } from 'mobx';

import cx from 'classnames';

import {
  scaleLinear,
  axisBottom,
  area,
  curveMonotoneY,
  mean,
  axisLeft,
  select,
  scaleBand,
} from 'd3';

import * as previousStyles from './ViolinGraph.scss';
import * as figureStyles from './figure.scss';
import styles from './ViolinGraphElement.scss';

import { autorun } from 'mobx';

const kernelEpanechnikov = (bandwidth: number) => {
  return (x: number) =>
    Math.abs((x /= bandwidth)) <= 1 ? (0.75 * (1 - x * x)) / bandwidth : 0;
};

const kde = (kernel: (x: number) => number, thresholds: number[], data: number[]) => {
  return thresholds.map((t) => [t, mean(data, (d) => kernel(t - d))]);
};

class FaultJSViolinElement extends DomElement {
  width = observable.box(400);
  height = observable.box(400);
  dataMap = [];

  kernalBandwidth = observable.box(0.2);
  tickResolution = observable.box(10);

  set bandwidth(value) {
    action(() => {
      this.kernalBandwidth.set(value);
    })();
  }

  set resolution(value) {
    action(() => {
      this.tickResolution.set(value);
    })();
  }

  public resizeObserver;

  [MOUNT]() {
    super[MOUNT]();
    const examScale = observable.box(scaleLinear().domain([0, 1]));
    const examAxis = observable.box(axisLeft(examScale.get()));
    const axisBottomElement = this.renderRoot.getElementById('axis-bottom');
    const examAxisSelection = select(this.renderRoot.getElementById('axis-left'));

    const techniqueScale = observable.box(scaleBand().padding(0.05));
    const techniqueAxis = observable.box(axisBottom(techniqueScale.get()));
    const techniqueAxisSelection = select(axisBottomElement);

    autorun(() => {
      examScale.get().range([0, this.height.get()]);
    });

    autorun(() => {
      this.height.get();
      examAxisSelection.call(examAxis.get());
    });

    autorun(() => {
      techniqueScale.get().range([0, this.width.get()]);
    });

    autorun(() => {
      techniqueScale.get().domain(this.dataMap.map(({ name }) => name));
    });

    autorun(() => {
      this.width.get();
      techniqueAxisSelection.call(techniqueAxis.get());
    });

    const violinGroup = this.renderRoot.getElementById('violin-group');
    const violinGroupSelection = select(violinGroup);

    autorun(() => {
      violinGroup.innerHTML = '';
      this.height.get();
      this.width.get();
      const bandwidth = techniqueScale.get().bandwidth();

      const nameToAreaValues = new Map(
        Object.values(this.dataMap).map(({ name, data }) => [
          name,
          kde(
            kernelEpanechnikov(this.kernalBandwidth.get()),
            examScale.get().ticks(this.tickResolution.get()),
            data.map(({ value }) => value),
          ),
        ]),
      );

      for (const [name, areaValues] of nameToAreaValues.entries()) {
        const nameOffset = techniqueScale.get()(name);

        const examDensityScale = scaleLinear()
          .domain([0, Math.max(...areaValues.map((d) => d[1]))])
          .range([0, 1]);

        const violinArea = area()
          .y((d) => examScale.get()(d[0]))
          .x0(
            (d) =>
              (Math.max(0, examDensityScale(d[1])) * bandwidth + bandwidth) / 2 +
              nameOffset,
          )
          .x1((d) => (-examDensityScale(d[1]) * bandwidth + bandwidth) / 2 + nameOffset)
          .curve(curveMonotoneY);

        violinGroupSelection.append('path').attr('d', violinArea(areaValues));
      }
    });

    const onResize = action(([measurer]) => {
      this.width.set(measurer.target.clientWidth);
      this.height.set(measurer.target.clientHeight);
      this[UPDATE]();
    });
    this.resizeObserver = new ResizeObserver(onResize);
    const container = this.renderRoot.getElementById('container');

    const svg = this.renderRoot.getElementById('svg');
    autorun(() => {
      svg.setAttribute(
        'viewBox',
        `-25 -5 ${this.width.get() + 25} ${this.height.get() + 25}`,
      );
    });

    autorun(() => {
      axisBottomElement.setAttribute('transform', `translate(0, ${this.height.get()})`);
    });

    this.resizeObserver.observe(container);
  }

  [UNMOUNT]() {
    this.resizeObserver.disconnect();
    super[UNMOUNT]();
  }

  render() {
    return (
      <>
        <style>{styles.toString()}</style>
        <div id="container" class={styles.locals.container}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            id="svg"
            fillRule="evenodd"
            class={styles.locals.svg}
            preserveAspectRatio="none"
            fill="000"
          >
            <g id="violin-group" />
            <g id="axis-left" />
            <g id="axis-bottom" />
          </svg>
        </div>
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
