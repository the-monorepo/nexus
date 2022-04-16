export const OK = Symbol('ok');
export const FAILURE = Symbol('error');
export type ResultType = typeof OK | typeof FAILURE;
