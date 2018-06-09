function typeOfCheck(type) {
  return value => typeof value === type;
}

export const isBoolean = typeOfCheck('boolean');
export const isString = typeOfCheck('string');
export const isNumber = typeOfCheck('number');
export const isFunction = typeOfCheck('function');
export function isArray(value) {
  return Array.isArray(value);
}

export function isObject(value) {
  return value instanceof Object && value.constructor === Object;
}
