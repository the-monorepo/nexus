import { Console } from 'console';
import util from 'util';

import chalk from 'chalk';

type DateFormatter = (date: Date) => string;
export type CustomOptions = {
  formatTimestamp: DateFormatter | null;
  tags: string[];
  level: string;
  defaultLevel: string;
};

/**
 * Restyles the util.inspect() method output.
 */
export const overrideUtilInspectStyle = () => {
  // We want field names to be yellow when logging JavaScript objects
  (util.inspect.styles as any).name = 'yellow';
};

export const defaultFormatTimestamp = (date: Date) => {
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

const preformatArgs = (args: any, useColors: boolean) =>
  args.map((arg) => {
    if (arg instanceof Error) {
      return `\n${util.inspect(arg, undefined, undefined, useColors)}`;
    } else {
      return arg;
    }
  });

type LevelColorFn = (tag: string) => string;

const createConsoleArgs = (
  level: string,
  levelColorFn: LevelColorFn,
  args: any[],
  options,
  customOptions: CustomOptions,
) => {
  const useColors = options.colorMode !== false;

  const extraArgs: any[] = [];
  if (customOptions.formatTimestamp !== null) {
    const timestamp = customOptions.formatTimestamp(new Date());
    extraArgs.push(useColors ? chalk.grey(timestamp) : timestamp);
  }

  const levelPrefix = (() => {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'log':
        return '💬';
      case 'debug':
        return '🔎';
      default:
        return '❌';
    }
  })();

  return [
    ...extraArgs,
    `${useColors ? levelColorFn(levelPrefix) : levelPrefix} `,
    ...(customOptions.tags.length > 0
      ? [customOptions.tags.map((tag) => `[${tag}]`).join('')]
      : []),
    ...preformatArgs(args, useColors),
  ];
};

const levelToImportanceMap: Map<string, number> = new Map(
  ['verbose', 'info', 'error', 'exception'].map((level, i) => [level, i]),
);

const logIfNeeded = (
  logFn,
  level: string,
  levelColorFn: LevelColorFn,
  args: any[],
  options,
  customOptions: CustomOptions,
) => {
  const importance = levelToImportanceMap.get(level)!;
  const importanceThreshold = levelToImportanceMap.get(customOptions.level)!;
  if (importance < importanceThreshold) {
    return;
  }

  return logFn(...createConsoleArgs(level, levelColorFn, args, options, customOptions));
};

class CustomConsole extends Console {
  public readonly customOptions: CustomOptions;
  public readonly options: any;
  constructor(
    {
      stdout = process.stdout,
      stderr = process.stderr,
      colorMode = 'auto',
      ...other
    } = {},
    {
      formatTimestamp = defaultFormatTimestamp,
      tags = [],
      level = 'info',
      defaultLevel = 'info',
    }: CustomOptions = {} as any,
  ) {
    super({
      stdout,
      stderr,
      colorMode: colorMode as any,
      ...other,
    });
    const options = {
      stdout,
      stderr,
      colorMode,
      ...other,
    };
    this.options = options;
    this.customOptions = { formatTimestamp, tags, level, defaultLevel };
  }

  child(...subTags: string[]) {
    return new CustomConsole(this.options, {
      ...this.customOptions,
      tags: [...this.customOptions.tags, ...subTags],
    });
  }

  exception(...args) {
    return logIfNeeded(
      (...args) => super.error(...args),
      'exception',
      chalk.redBright,
      args,
      this.options,
      this.customOptions,
    );
  }

  warn(...args) {
    return logIfNeeded(
      (...args) => super.warn(...args),
      'warn',
      chalk.yellowBright,
      args,
      this.options,
      this.customOptions,
    );
  }

  log(...args) {
    return this.info(...args);
  }

  debug(...args) {
    return logIfNeeded(
      (...args) => super.debug(...args),
      'debug',
      chalk.blueBright,
      args,
      this.options,
      this.customOptions,
    );
  }

  info(...args) {
    return logIfNeeded(
      (...args) => super.info(...args),
      'info',
      chalk.greenBright,
      args,
      this.options,
      this.customOptions,
    );
  }

  error(...args) {
    return logIfNeeded(
      (...args) => super.error(...args),
      'error',
      chalk.redBright,
      args,
      this.options,
      this.customOptions,
    );
  }

  verbose(...args) {
    return logIfNeeded(
      (...args) => super.info(...args),
      'verbose',
      chalk.cyanBright,
      args,
      this.options,
      this.customOptions,
    );
  }
}

export { CustomConsole as Console };

const createLogger = (options?: any, customOptions?: CustomOptions) => {
  return new CustomConsole(options, customOptions);
};

export default createLogger;
