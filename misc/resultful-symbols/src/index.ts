/**
 * These symbols allow the use of switch-case syntax
 */

export const SUCCESS = Symbol('success');
export const ERROR = Symbol('error');
export const EXCEPTION = Symbol('exception');

export type Symbols = typeof SUCCESS | typeof ERROR | typeof EXCEPTION;
