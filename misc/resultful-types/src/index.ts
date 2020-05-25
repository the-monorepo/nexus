/**
 * These strings allow the use of switch-case syntax
 */

export const SUCCESS = 'success';
export const ERROR = 'error';
export const EXCEPTION = 'exception';

export type ResultType = typeof SUCCESS | typeof ERROR | typeof EXCEPTION;
