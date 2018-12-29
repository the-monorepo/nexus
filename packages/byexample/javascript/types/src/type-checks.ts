export type TypeCheck = (value: any) => boolean;

function typeOfCheck(type: any): TypeCheck {
  return (value) => typeof value === type;
}

export const isBoolean: TypeCheck = typeOfCheck('boolean');
export const isString: TypeCheck = typeOfCheck('string');
export const isNumber: TypeCheck = typeOfCheck('number');
export const isFunction: TypeCheck = typeOfCheck('function');

export function isArray(value: any): boolean {
  return Array.isArray(value);
}

export function isObject(value: any): boolean {
  return value instanceof Object && value.constructor === Object;
}
