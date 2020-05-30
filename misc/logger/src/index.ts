import util from 'util';

import { createLogger, format, transports } from 'winston';

import * as psFormats from '@pshaw/winston-formats';

export type TransportOptions = {
  level?: string;
  colors?: boolean;
  timestamp?: string | null | boolean;
};

export type FileTransportOptions = {
  path?: string;
} & TransportOptions;

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

export function logger() {
  const formatters: any[] = [];
  formatters.push(psFormats.errors(), psFormats.align());
  const aLogger = createLogger({
    format: format.combine(...formatters),
  });
  return aLogger;
}
export default logger;

/**
 * Restyles the util.inspect() method output.
 */
export function overrideUtilInspectStyle() {
  // We want field names to be yellow when logging JavaScript objects
  util.inspect.styles.name = 'yellow';
}
