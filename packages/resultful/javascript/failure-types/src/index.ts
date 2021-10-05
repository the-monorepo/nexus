/**
 * These strings allow the use of switch-case syntax
 */

 export const ERROR = Symbol('error');
 export const UNKNOWN = Symbol('unknown');

 export type FailureType = typeof ERROR | typeof UNKNOWN;
