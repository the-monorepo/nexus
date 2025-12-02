export const OK = 'ok' as const;
export const FAILURE = 'error' as const;
export type ResultType = typeof OK | typeof FAILURE;
