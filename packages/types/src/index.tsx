import {
  isBoolean,
  isObject,
  isArray,
  isString,
  isFunction,
  isNumber,
} from './type-checks';

function allAreIntegers(values) {
  for (const value of values) {
    if (!Number.isInteger(value)) {
      return false;
    }
  }
  return true;
}

type TypeCheck = (...stuff: any[]) => boolean;
type TypeTestInfo = {
  readonly typeCheck: (...params: any[]) => any;
  readonly value: (...params: any[]) => any;
};
export function typeTest(typeCheck: TypeCheck, value): TypeTestInfo {
  return { typeCheck, value };
}

type TypeChecks = {
  [key: string]: TypeCheck;
};

export function defaultTypeTests(values): TypeTestInfo[] {
  return [
    typeTest(isBoolean, () => ({ type: 'boolean' })),
    typeTest(isString, () => ({ type: 'string' })),
    typeTest(isFunction, () => ({ type: 'function' })),
    typeTest(isNumber, () => ({
      type: 'number',
      format: () => allAreIntegers(values) ? 'integer' : 'number',
    })),
    typeTest(isArray, () => ({
      type: 'array',
    })),
    typeTest(isObject, () => ({
      type: 'object',
    })),
  ];
}

export function findTypes(values, typeCallbacks) {
  const { nullCount, undefinedCount, typeValues } = runTypeTests(values, defaultTypeTests(values));
  return {
    nullCount,
    undefinedCount,
    info: typeValues.map((callback) => callback())
  };
}

export function nullCounts(values: any[]): number {
  return values.filter(value => value === null).length;
}

export function undefinedCounts(values: any[]): number {
  return values.filter(value => value === undefined).length;
}

export function runTypeTests(values, typeTests: TypeTestInfo[] = defaultTypeTests(values)) {
  const undefinedCount = undefinedCounts(values);
  const nullCount = nullCounts(values);
  for (const value of values) {
    for (let i = typeTests.length - 1; i >= 0; i--) {
      if (!typeTests[i].typeCheck(value)) {
        typeTests.splice(i, 1);
      }
    }
  }
  return { nullCount, undefinedCount, typeValues: typeTests.map(({ value }) => value) };
}
