import util from 'util';
import { createLogger, format, transports } from 'winston';

import * as psFormats from '@pshaw/winston-formats';

export interface LoggerOptions {
  // True if you want timestamps added to your logged output
  timestamp?: boolean;
}

export interface TransportOptions {
  level?: string;
  colors?: boolean;
}

export interface FileTransportOptions extends TransportOptions {
  path?: string;
}

export function consoleTransport(options: TransportOptions = {}) {
  const formats = [];
  if (options.colors) {
    formats.push(format.colorize(), psFormats.colorize());
  }
  formats.push(psFormats.objects({ colors: options.colors }), psFormats.printer);
  return new transports.Console({
    level: options.level,
    format: format.combine(...formats),
  });
}

export function fileTransport(options: FileTransportOptions = {}) {
  return new transports.File({
    filename: options.path,
    level: options.level,
    format: format.combine(psFormats.objects({ colors: false }), psFormats.printer),
  });
}

export function logger(options: LoggerOptions = {}) {
  const { timestamp = true } = options;
  const formatters: any[] = [];
  if (timestamp) {
    formatters.push(psFormats.timestamp());
  }
  formatters.push(psFormats.errors(), psFormats.align());
  return createLogger({
    format: format.combine(...formatters),
  });
}
export default logger;

/**
 * Replaces the console.log type methods with our own logger methods.
 * It's not recommended to use console methods to print. Use the logger variable itself to log messages.
 * However, this method is useful when external packages have console.log(...) calls inside of them.
 */
export function overrideConsoleLogger(aLogger) {
  // Since we're using splat we have to create placeholders for the arguments to go into
  // TODO: Note that string interpolation with console.log won't work (E.g. console.log("%s", "test") will print "%stest")
  const createPlaceholders = args => new Array(args.length).fill('%s').join(' ');
  Object.keys(aLogger.levels).forEach(level => {
    console[level] = (...args) => aLogger[level](createPlaceholders(args), ...args);
  });
  // tslint:disable-next-line:no-console
  console.log = (...args) => aLogger.verbose(createPlaceholders(args), ...args);
}

/**
 * Restyles the util.inspect() method output.
 */
export function overrideUtilInspectStyle() {
  // We want field names to be yellow when logging JavaScript objects
  util.inspect.styles.name = 'yellow';
}
