import streamToPromise from 'stream-to-promise';

import {
  TASK_INFO,
  parallel as buildplanParallel,
  series as buildplanSeries,
  task as buildplanTask,
} from '@buildplan/core';

export const oldStreamToPromise = async (something) => {
  const value = await something;
  if (
    value !== undefined &&
    value !== null &&
    value.constructor !== undefined &&
    value.constructor.name === 'Pumpify'
  ) {
    return streamToPromise(value);
  }

  return value;
};

export const task = (name: string, descriptionOrCallback, callbackOrUndefined?) => {
  const callback =
    callbackOrUndefined === undefined ? descriptionOrCallback : callbackOrUndefined;
  const wrapped = { [name]: () => oldStreamToPromise(callback()) }[name];
  if (callback[TASK_INFO] !== undefined) {
    wrapped[TASK_INFO] = callback[TASK_INFO];
  }
  return buildplanTask(
    name,
    callbackOrUndefined !== undefined ? descriptionOrCallback : '',
    callback,
  );
};

export const series = (...tasks) =>
  buildplanSeries(
    ...tasks.map((aTask) => {
      const wrapped = { [aTask.name]: () => oldStreamToPromise(aTask()) }[aTask.name];
      if (aTask[TASK_INFO] !== undefined) {
        wrapped[TASK_INFO] = aTask[TASK_INFO];
      }
      return wrapped;
    }),
  );

export const parallel = (...tasks) =>
  buildplanParallel(
    ...tasks.map((aTask) => {
      const wrapped = { [aTask.name]: () => oldStreamToPromise(aTask()) }[aTask.name];
      if (aTask[TASK_INFO] !== undefined) {
        wrapped[TASK_INFO] = aTask[TASK_INFO];
      }
      return wrapped;
    }),
  );
