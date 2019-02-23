import util from 'util';

import chalk from 'chalk';
import moment from 'moment';
import { SPLAT } from 'triple-beam';
import { format } from 'winston';

export const errors = format(info => {
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

export const objects = format((info, options) => {
  // TODO: Remove the any type when winston types gets fixed
  const message: any = info.message;
  if (
    !(info instanceof Error) &&
    (message instanceof Object || Array.isArray(info.message))
  ) {
    info.message = util.inspect(info.message, { colors: options.colors });
  }
  return info;
});

// Adds a timestamp to the logger information
export const timestamp = format(
  (info, { format: timestampFormat = 'YYYY-MM-DD HH:mm:ss' }) => {
    info.timestamp = moment(new Date()).format(timestampFormat);
    return info;
  },
);

// Aligns all the information before the message section of the log
export const align = format(info => {
  const messageIndentation = 8;
  info.levelPadding = ' '.repeat(messageIndentation - info.level.length);
  return info;
});

// Colorizes/formats javascript objects and timestamps
export const colorize = format(info => {
  info.timestamp = chalk.gray(info.timestamp);
  return info;
});

// Specifies the order in which all the information is printed out
export const printer = format.printf((info) => {
  const timestampString = info.timestamp;
  const splat = info[SPLAT];
  const splatList = splat
    ? splat.map(item => (item === undefined ? 'undefined' : item))
    : [];
  const levelPadding = info.levelPadding ? info.levelPadding : '';
  const selectedMessage = info.errorMessage ? info.errorMessage : info.message;
  const message = selectedMessage === undefined ? 'undefined' : selectedMessage;
  const tags = info.tags ? info.tags : [];
  const displayTags =  tags.map(tag => `[${tag}]`);
  return [timestampString, info.level + levelPadding, ...displayTags, message, ...splatList]
    .filter(item => item !== undefined)
    .join(' ');
});
