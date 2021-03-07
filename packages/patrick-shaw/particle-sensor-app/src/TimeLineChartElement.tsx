import * as cinder from 'cinder';
import { render, DomElement, UPDATE, MOUNT, UNMOUNT } from 'cinder';

import { computed, observable, reaction, action } from 'mobx';

import cx from 'classnames';

import * as d3 from 'd3';
import {
  scaleLinear,
  axisBottom,
  area,
  curveMonotoneX,
  extent,
  mean,
  axisLeft,
  timeFormat,
  scaleTime,
  select,
  group,
  rollup,
  scaleBand,
} from 'd3';

import * as figureStyles from './figure.scss';
import styles from './TimeLineGraph.scss';

import { COLUMN, ROW, LayoutFlow } from './LayoutFlows';
import { autorun } from 'mobx';

export class TimeLineChartElement extends DomElement {
  width = observable.box(400);
  height = observable.box(400);

  public resizeObserver;

  private _dataClient = observable.box({
    interfaces: [],
  });

  get dataClient() {
    return this._dataClient.get();
  }

  set dataClient(value) {
    action(() => {
      this._dataClient.set(value);
    })();
  }

  [MOUNT]() {
    super[MOUNT]();
    const yScale = observable.box(scaleLinear().domain([0, 1]).nice());
    const yAxis = observable.box(axisLeft(yScale.get()));

    const xAxisElement = this.renderRoot.getElementById('axis-bottom');
    const yAxisSelection = select(this.renderRoot.getElementById('axis-left'));

    const xScale = observable.box(scaleTime().domain([0, Date.now()]).nice());
    const xAxis = observable.box(axisBottom(xScale.get()).tickFormat(timeFormat('%I:%M:%S')));
    const xAxisSelection = select(xAxisElement);

    let maxX = observable.box(Date.now());
    let minX = observable.box(Date.now());
    let maxY = observable.box(0);

    autorun(() => {
      let newMaxY = 0;
      for (const aInterface of this.dataClient.interfaces) {
        for (const datum of aInterface.data) {
          newMaxY = Math.max(maxY, datum.y);
        }
      }
      maxY.set(newMaxY);
    });

    autorun(() => {
      setInterval(action(() => {
        maxX.set(Date.now());
      }), 1000);
    });

    autorun(() => {
      let newMinX = Number.POSITIVE_INFINITY;
      for (const aInterface of this.dataClient.interfaces) {
        for (const datum of aInterface.data) {
          newMinX = Math.min(minX, datum.x);
        }
      }
      const safeMinX = Math.min(newMinX, Date.now());
      minX.set(safeMinX);
    });


    autorun(() => {
      yScale.get().range([this.height.get(), 0]);
    });

    autorun(() => {
      yScale.get().domain([0, maxY.get()]).nice();
    })

    autorun(() => {
      xScale.get().domain([minX.get(), maxX.get()]).nice();
    });

    autorun(() => {
      xScale.get().range([0, this.width.get()]);
    });

    autorun(() => {
      this.height.get();
      maxY.get();

      yAxisSelection.call(yAxis.get());
    });

    autorun(() => {
      this.width.get();
      minX.get();
      maxX.get();

      xAxisSelection.call(xAxis.get());
    });

    const chartGroup = this.renderRoot.getElementById('chart-group');
    const chartGroupSelection = select(chartGroup);

    autorun(() => {
      chartGroup.innerHTML = '';
      this.height.get();
      this.width.get();

      const interfaces = this.dataClient.interfaces;

      for (const aInterface of interfaces) {
        const name = aInterface.name;

        chartGroupSelection
          .append('path')
          .datum(aInterface.data)
          .attr('fill', 'none')
          .attr('stroke', aInterface.color)
          .attr('stroke-width', 1.5)
          .attr(
            'd',
            d3
              .line()
              .y((d) => yScale.get()(d.y))
              .x((d) => xScale.get()(d.x))
              .curve(curveMonotoneX),
          );
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
      xAxisElement.setAttribute('transform', `translate(0, ${this.height.get()})`);
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
            fill-rule="evenodd"
            class={styles.locals.svg}
            preserveAspectRatio="none"
            fill="000"
            overflow="visible"
          >
            <g id="chart-group" />
            <g id="axis-left" />
            <g id="axis-bottom" />
          </svg>
        </div>
      </>
    );
  }
}

const Label = ({ children }) => (
  <label class={cx(previousStyles.label)}>{children}</label>
);
