/**
 * These strings allow the use of switch-case syntax
 */

export const PAYLOAD = 'payload';
/**
 * Alias for {@link PAYLOAD}
 */
export const SUCCESS = PAYLOAD;
/**
 * Alias for {@link PAYLOAD}
 */
export const NORMAL = PAYLOAD;
export const ERROR = 'error';
export const EXCEPTION = 'exception';

export type ResultType = typeof PAYLOAD | typeof ERROR | typeof EXCEPTION;
