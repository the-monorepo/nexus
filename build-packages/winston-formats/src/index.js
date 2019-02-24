const util = require('util');

const chalk = require('chalk');
const moment = require('moment');
const { SPLAT } = require('triple-beam');
const { format } = require('winston');

module.exports.errors = format(info => {
  if (info instanceof Error) {
    /*
      TODO: Winston 3.0.0 removes .message for errors for some reason.
      Using a workaround found here: https://github.com/winstonjs/winston/issues/1243 to preserve the message
    */

    if (info.stack) {
      info.errorMessage = info.stack;
    } else {
      info.errorMessage = info.message;
    }
  }
  return info;
});

module.exports.objects = format((info, options) => {
  // TODO: Remove the any type when winston types gets fixed
  const message = info.message;
  if (
    !(info instanceof Error) &&
    (message instanceof Object || Array.isArray(info.message))
  ) {
    info.message = util.inspect(info.message, { colors: options.colors });
  }
  return info;
});

// Adds a timestamp to the logger information
module.exports.timestamp = format(
  (info, { format: timestampFormat = 'YYYY-MM-DD HH:mm:ss' }) => {
    info.timestamp = moment(new Date()).format(timestampFormat);
    return info;
  },
);

// Aligns all the information before the message section of the log
module.exports.align = format(info => {
  const messageIndentation = 8;
  info.levelPadding = ' '.repeat(messageIndentation - info.level.length);
  return info;
});

// Colorizes/formats javascript objects and timestamps
module.exports.colorize = format(info => {
  info.timestamp = chalk.gray(info.timestamp);
  return info;
});

// Specifies the order in which all the information is printed out
module.exports.printer = format.printf(info => {
  const timestampString = info.timestamp;
  const splat = info[SPLAT];
  const splatList = splat
    ? splat.map(item => (item === undefined ? 'undefined' : item))
    : [];
  const levelPadding = info.levelPadding ? info.levelPadding : '';
  const selectedMessage = info.errorMessage ? info.errorMessage : info.message;
  const message = selectedMessage === undefined ? 'undefined' : selectedMessage;
  const tags = info.tags ? info.tags : [];
  const displayTagsString = tags.map(tag => `[${tag}]`).join('');
  return [
    timestampString,
    info.level + levelPadding,
    displayTagsString ? displayTagsString : undefined,
    message,
    ...splatList,
  ]
    .filter(item => item !== undefined)
    .join(' ');
});
