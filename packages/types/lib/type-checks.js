'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.isArray = isArray;
exports.isObject = isObject;
exports.isFunction = exports.isNumber = exports.isString = exports.isBoolean = void 0;

function typeOfCheck(type) {
  return value => typeof value === type;
}

const isBoolean = typeOfCheck('boolean');
exports.isBoolean = isBoolean;
const isString = typeOfCheck('string');
exports.isString = isString;
const isNumber = typeOfCheck('number');
exports.isNumber = isNumber;
const isFunction = typeOfCheck('function');
exports.isFunction = isFunction;

function isArray(value) {
  return Array.isArray(value);
}

function isObject(value) {
  return value instanceof Object && value.constructor === Object;
}
