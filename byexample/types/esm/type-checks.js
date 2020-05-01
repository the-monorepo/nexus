"use strict";

function typeOfCheck(type) {
  return value => typeof value === type;
}

export var isBoolean = typeOfCheck('boolean');
export var isString = typeOfCheck('string');
export var isNumber = typeOfCheck('number');
export var isFunction = typeOfCheck('function');
export function isArray(value) {
  return Array.isArray(value);
}
export function isObject(value) {
  return value instanceof Object && value.constructor === Object;
}
//# sourceMappingURL=type-checks.js.map
