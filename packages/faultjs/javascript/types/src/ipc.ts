/**
 * For recording assertion results
 */
export const ASSERTION = 'submit-assertion-result';
/**
 * For recording test results
 */
export const TEST = 'submit-test-result';

/**
 * For when you want to notify the test worker to finish
 */
export const STOP_WORKER = 'stop-worker';

/**
 * Run a test
 */
export const TEST_FILE = 'test-file';

/**
 * Sent once the worker has finally stopped running/exitted
 */
export const STOPPED_WORKER = 'stopped';

export const NO_MORE_TESTS_FOR_WORKER = 'no-more-tests';

export const TEST_TAKING_TOO_LONG = 'test-taking-too-long';

export const WORKING_ON_TEST = 'working-on-test';
