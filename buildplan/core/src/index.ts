import chalk from 'chalk';
import yargs from 'yargs';

import createLogger from '@pshaw/logger';

const log = createLogger({ colorMode: 'auto' });

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

export type TaskCallback = () => TaskResult;

export type TaskFn = {
  (name: string, description: string, callback: TaskCallback): any;
  (name: string, callback: TaskCallback): any;
};

export type TaskExceptionInfo = {
  exception: any;
  taskName: string;
}

export type TaskExceptionHandler = (taskException: TaskExceptionInfo) => any;

const defaultExceptionHandler = ({ exception, taskName }: TaskExceptionInfo) => {
  log.exception(`An expected error occurred in the "${chalk.cyan(taskName)}" task`, exception);
}

let currentExceptionHandler = defaultExceptionHandler;
export const setExceptionHandler = (exceptionHandler: TaskExceptionHandler) => {
  currentExceptionHandler = exceptionHandler;
}

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

const createTask = (
  name: string,
  description: string | undefined,
  callback: TaskCallback,
) => {
  const descriptionValue = description !== undefined ? description : false;

  yargs.command(
    name,
    descriptionValue as any, // TODO: Not sure how to get this Type to work
    () => {},
    async () => {
      try {
        const value = callback();
        await waitForTaskReturnValue(value);  
      } catch(err) {
        // eslint-disable-next-line no-console
        currentExceptionHandler({ exception: err, taskName: name });
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
  if (callbackOrUndefined === undefined) {
    return createTask(name, undefined, descriptionOrCallback as TaskCallback);
  } else {
    return createTask(
      name,
      descriptionOrCallback as string,
      callbackOrUndefined as TaskCallback,
    );
  }
};

export const parallel = (...taskCallbacks: TaskCallback[]) => {
  const runInParallel = async () => {
    await Promise.all(taskCallbacks.map((task) => task()).map(waitForTaskReturnValue));
  };

  return runInParallel;
};

export const series = (...taskCallbacks: TaskCallback[]) => {
  const runInSeries = async () => {
    for (const task of taskCallbacks) {
      await waitForTaskReturnValue(task());
    }
  };

  return runInSeries;
};

export const run = () => yargs.argv;
