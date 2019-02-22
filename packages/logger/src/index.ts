import util from 'util';

import { createLogger, format, transports } from 'winston';

import * as psFormats from '@pshaw/winston-formats';

export interface TransportOptions {
  level?: string;
  colors?: boolean;
  timestamp?: string | null | boolean;
}

export interface FileTransportOptions extends TransportOptions {
  path?: string;
}

function getFormats({ colors, timestamp }: TransportOptions = {}, defaults) {
  const formats: any[] = [];
  if (timestamp) {
    const timestampFormat =
      typeof timestamp === 'boolean' ? defaults.timestampFormat : timestamp;
    formats.push(psFormats.timestamp({ format: timestampFormat }));
  }
  if (colors) {
    formats.push(format.colorize(), psFormats.colorize());
  }
  formats.push(psFormats.objects({ colors }), psFormats.printer);
  return formats;
}

export function consoleTransport({
  level,
  colors = true,
  timestamp = true,
}: TransportOptions = {}) {
  const formats = getFormats({ colors, timestamp }, { timestampFormat: 'hh:mm:ss' });
  return new transports.Console({
    level,
    format: format.combine(...formats),
  });
}

export function fileTransport({
  path,
  level,
  timestamp = true,
  colors = false,
}: FileTransportOptions = {}) {
  const formats = getFormats({ colors, timestamp }, { timestampFormat: undefined });
  return new transports.File({
    filename: path,
    level,
    format: format.combine(...formats, psFormats.printer),
  });
}

type TaggableLogger<Logger> = {
  [K in keyof Logger]: Logger[K] extends (...args: any) => any
    ? ReturnType<Logger[K]> extends Logger
      ? (...args: Parameters<Logger[K]>) => TaggableLogger<Logger>
      : Logger[K]
    : Logger[K]
} & {
  tag: (tagString: string) => TaggableLogger<Logger>;
};
function createTagFn(loggerObj) {
  return tag => {
    const taggedLoggerObj = {
      ...loggerObj,
      ...Object.keys(loggerObj.levels)
        .concat('log')
        .reduce((prev, key) => {
          prev[key] = message => {
            loggerObj[key](`[${tag}] ${message}`);
          };
          return prev;
        }, {})
      };
    (taggedLoggerObj as any).tag = createTagFn(taggedLoggerObj);
    return taggedLoggerObj;
  };
}

export function logger() {
  const formatters: any[] = [];
  formatters.push(psFormats.errors(), psFormats.align());
  const aLogger = createLogger({
    format: format.combine(...formatters),
  });

  (aLogger as any).tag = createTagFn(aLogger);
  // TODO: Remove the as any
  return (aLogger as any) as TaggableLogger<typeof aLogger>;
}
export default logger;

/**
 * Replaces the console.log type methods with our own logger methods.
 * It's not recommended to use console methods to print. Use the logger variable itself to log messages.
 * However, this method is useful when external packages have console.log(...) calls inside of them.
 */
export function overrideConsoleLogger(aLogger) {
  // Since we're using splat we have to create placeholders for the arguments to go into
  /*
    TODO: Note that string interpolation with console.log won't work
    (E.g. console.log("%s", "test") will print "%stest")
  */
  const createPlaceholders = args => new Array(args.length).fill('%s').join(' ');
  Object.keys(aLogger.levels).forEach(level => {
    // eslint-disable-next-line no-console
    console[level] = (...args) => aLogger[level](createPlaceholders(args), ...args);
  });
  // eslint-disable-next-line no-console
  console.log = (...args) => aLogger.verbose(createPlaceholders(args), ...args);
}

/**
 * Restyles the util.inspect() method output.
 */
export function overrideUtilInspectStyle() {
  // We want field names to be yellow when logging JavaScript objects
  util.inspect.styles.name = 'yellow';
}
