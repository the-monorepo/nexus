const { format } = require.requireActual('winston');
/**
 * Essentially removes the implementation of a formatter and replaces it with a new
 * formatter that doesn't do anything in terms of formatting
 */
export function mockFormatter() {
  return format(info => info);
}
