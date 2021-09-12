import chalk from 'chalk';
import yargs from 'yargs';

import createLogger from '@pshaw/logger';

import * as TaskTypes from './TaskTypes.ts';
export { TaskTypes };

const log: Console = createLogger({ colorMode: 'auto' });

type SynchronousTaskResult = undefined | any;
type IteratorTaskResult = Iterable<TaskResult>;
type StreamTaskResult = AsyncIterableIterator<TaskResult>;
type AsyncIterableTaskResult = AsyncIterableIterator<TaskResult>;
type PromiseTaskResult = Promise<TaskResult>;

type TaskResult =
  | SynchronousTaskResult
  | IteratorTaskResult
  | StreamTaskResult
  | AsyncIterableTaskResult
  | PromiseTaskResult;

export type TaskInfo = {
  isRootTask: boolean;
};

export type TaskCallback = () => TaskResult;

export type TaskFn = {
  (name: string, description: string, callback: TaskCallback): any;
  (name: string, callback: TaskCallback): any;
};

export type TaskExceptionInfo = {
  exception: any;
  taskName: string;
};

export type TaskExceptionHandler = (taskException: TaskExceptionInfo) => any;

const defaultExceptionHandler = ({ exception, taskName }: TaskExceptionInfo) => {
  log.error(
    `An expected error occurred in the '${chalk.cyanBright(taskName)}' task`,
    exception,
  );
};

const waitForTaskReturnValue = async (taskValue: TaskResult): Promise<any> => {
  const resolvedValue = await taskValue;

  if (resolvedValue === undefined) {
    return;
  }

  if (resolvedValue === null) {
    return;
  }

  if (
    resolvedValue[Symbol.asyncIterator] !== undefined ||
    resolvedValue[Symbol.iterator] !== undefined
  ) {
    for await (const actuallyResolvedValue of resolvedValue) {
      await waitForTaskReturnValue(actuallyResolvedValue);
    }
  }
};

export const TASK_INFO = Symbol('task-info');

type ParallelTaskInfo = {
  type: typeof TaskTypes.PARALLEL;
  value: TaskCallback[];
};

type SerialTaskInfo = {
  type: typeof TaskTypes.SERIES;
  value: TaskCallback[];
};

type InternalTaskInfo = ParallelTaskInfo | SerialTaskInfo;

const callbackToStringCode = (taskCallback: TaskCallback): string => {
  const taskInfo: InternalTaskInfo | undefined = taskCallback[TASK_INFO];
  if (taskInfo !== undefined) {
    const flatteningType = taskInfo.type;
    const flattened = [...taskInfo.value];
    let i = 0;
    while (i < flattened.length) {
      const child = flattened[i];
      const childTaskInfo = child[TASK_INFO];
      if (
        childTaskInfo !== undefined &&
        (childTaskInfo.value.length <= 1 || childTaskInfo.type === flatteningType)
      ) {
        flattened.splice(i, 1, ...childTaskInfo.value);
      } else {
        i++;
      }
    }
    if (taskInfo.type === TaskTypes.PARALLEL) {
      return `[${flattened.map(callbackToStringCode).join(', ')}]`;
    } else if (taskInfo.type === TaskTypes.SERIES) {
      return flattened.map(callbackToStringCode).join(' -> ');
    }
  }

  return chalk.cyanBright(taskCallback.name !== '' ? taskCallback.name : 'anonymous');
};

const duraitonNumberFormat = new Intl.NumberFormat(undefined, {
  style: 'unit',
  unit: 'second',
  unitDisplay: 'narrow',
  maximumFractionDigits: 2,
});

const createTask = (
  name: string,
  description: string | undefined,
  callback: TaskCallback,
) => {
  const descriptionValue = description !== undefined ? description : '';

  yargs.command(
    name,
    descriptionValue,
    () => {},
    async () => {
      try {
        const value = callback();
        const taskSummary = callbackToStringCode(callback);
        log.info(`Running ${taskSummary}`);
        const startTime = Date.now();
        await waitForTaskReturnValue(value);
        const endTime = Date.now();
        const durationMessage = `(${duraitonNumberFormat.format(
          (endTime - startTime) / 1000,
        )})`;
        log.info(`Finished ${taskSummary} ${chalk.grey(durationMessage)}`);
      } catch (err) {
        defaultExceptionHandler({ exception: err, taskName: name });
        process.exitCode = 1;
      }
    },
  );
};

export const task: TaskFn = (
  name: string,
  descriptionOrCallback: string | TaskCallback,
  callbackOrUndefined?: TaskCallback,
) => {
  const callback =
    callbackOrUndefined === undefined
      ? (descriptionOrCallback as TaskCallback)
      : callbackOrUndefined;

  // TODO: Better names
  const realCallback =
    typeof callback === 'string'
      ? async () => {
          const { default: run } = await import(callback);
          return run();
        }
      : callback;

  return createTask(
    name,
    callbackOrUndefined !== undefined ? (descriptionOrCallback as string) : '-',
    realCallback,
  );
};

export const parallel = (...taskCallbacks: TaskCallback[]) => {
  const runInParallel: TaskCallback = async () => {
    await Promise.all(taskCallbacks.map((task) => task()).map(waitForTaskReturnValue));
  };

  runInParallel[TASK_INFO] = {
    type: TaskTypes.PARALLEL,
    value: taskCallbacks,
  };

  return runInParallel;
};

export const series = (...taskCallbacks: TaskCallback[]) => {
  const runInSeries: TaskCallback = async () => {
    for (const task of taskCallbacks) {
      await waitForTaskReturnValue(task());
    }
  };

  runInSeries[TASK_INFO] = {
    type: TaskTypes.SERIES,
    value: taskCallbacks,
  };

  return runInSeries;
};

export const run = () => yargs.parse();
