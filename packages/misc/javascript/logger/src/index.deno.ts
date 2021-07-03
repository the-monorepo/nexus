/* eslint-disable no-console */

// TODO
export const overrideUtilInspectStyle = () => {};

// TODO
class DenoConsole {
  constructor(private readonly options, private readonly customOptions) {}
  child(...subTags: string[]) {
    return new DenoConsole(this.options, {
      ...this.customOptions,
      tags: [...this.customOptions.tags, ...subTags],
    });
  }

  exception(...args) {
    console.exception(...args);
  }

  warn(...args) {
    console.warn(...args);
  }

  log(...args) {
    console.log(...args);
  }

  debug(...args) {
    console.debug(...args);
  }

  info(...args) {
    console.info(...args);
  }

  error(...args) {
    console.error(...args);
  }

  verbose(...args) {
    console.log(...args);
  }
}

// TODO:
const createLogger = (options: any, customOptions: any) => {
  return new DenoConsole(options, customOptions);
};

export default createLogger;
