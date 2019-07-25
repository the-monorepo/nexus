'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.urlFromConfig = urlFromConfig;
exports.readConfig = readConfig;

var _path = require('path');

var _fsExtra = require('fs-extra');

/**
 * Gets the url of a particular section of the config based off the protocol, host and port fields.
 * @param config The configuration (usually the return value from readConfig)
 * @param prefix The sub config that you want the url fields to be taken from E.g. 'server' or 'ui'
 */
function urlFromConfig(config, prefix) {
  return `${config.get(`${prefix}.protocol`)}://${config.get(
    `${prefix}.host`,
  )}:${config.get(`${prefix}.port`)}`;
}

async function readConfig(schema, configName, extensions = ['json']) {
  const cwd = process.cwd();
  let parsedConfig;
  const fileNamePrefix = configName ? `${configName}.` : '';

  for (const ext of extensions) {
    const path = (0, _path.join)(cwd, `${fileNamePrefix}.config.${ext}`);

    if (await (0, _fsExtra.pathExists)(path)) {
      parsedConfig = schema.loadFile(path);
      break;
    }
  }

  if (!parsedConfig) {
    throw new Error(
      `Failed to find an ${configName}.config.${extensions.join('/')} file`,
    );
  }

  schema.validate({
    allowed: 'strict',
  });
  return parsedConfig;
}
//# sourceMappingURL=index.js.map
