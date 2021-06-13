export const SERIES = Symbol('series');
export const PARALLEL = Symbol('parallel');
export const SINGLE_TASK = Symbol('single-task');

export type TaskType = typeof SERIES | typeof PARALLEL | typeof SINGLE_TASK;
