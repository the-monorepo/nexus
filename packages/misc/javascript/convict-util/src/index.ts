import { join } from 'path';

import { pathExists } from 'fs-extra';

/**
 * Gets the url of a particular section of the config based off the protocol, host and port fields.
 * @param config The configuration (usually the return value from readConfig)
 * @param prefix The sub config that you want the url fields to be taken from E.g. 'server' or 'ui'
 */
export function urlFromConfig(config, prefix: string): string {
  return `${config.get(`${prefix}.protocol`)}://${config.get(
    `${prefix}.host`,
  )}:${config.get(`${prefix}.port`)}`;
}

export async function readConfig(
  schema,
  configName?: string,
  extensions: string[] = ['json'],
) {
  const cwd = process.cwd();
  let parsedConfig;
  const fileNamePrefix = configName ? `${configName}.` : '';
  for (const ext of extensions) {
    const path = join(cwd, `${fileNamePrefix}.config.${ext}`);
    if (await pathExists(path)) {
      parsedConfig = schema.loadFile(path);
      break;
    }
  }
  if (!parsedConfig) {
    throw new Error(
      `Failed to find an ${configName}.config.${extensions.join('/')} file`,
    );
  }
  schema.validate({ allowed: 'strict' });
  return parsedConfig;
}
