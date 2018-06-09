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
  readonly callback: (...params: any[]) => any;
};
export function typeTest(typeCheck: TypeCheck, callback): TypeTestInfo {
  return { typeCheck, callback };
}

type TypeChecks = {
  [key: string]: TypeCheck;
};

export function defaultTypeTests(values): TypeTestInfo[] {
  return [
    typeTest(isBoolean, { type: 'boolean' }),
    typeTest(isString, { type: 'string' }),
    typeTest(isFunction, () => ({ type: 'function' })),
    typeTest(isNumber, {
      type: 'number',
      format: allAreIntegers(values) ? 'integer' : 'number',
    }),
    typeTest(isArray, {
      type: 'array',
    }),
    typeTest(isObject, {
      type: 'object',
    }),
  ];
}

export function findSingleType(values, typeCallbacks) {
  return runSingularTypeTests(values, defaultTypeTests(values));
}

export function findMultipleTypes(values, typeCallbacks) {
  return runSingularTypeTests(values, defaultTypeTests(values));
}

export function runMultiTypeTests(values, typeTests: TypeTestInfo[]) {
  const successfulTypeTests = [];
  let undefinedCount = 0;
  let nullCount = 0;
  for (const value of values) {
    if (value === null) {
      nullCount += 1;
    }
    if (value === null) {
      undefinedCount += 1;
    }
    for (let i = typeTests.length - 1; i >= 0; i--) {
      if (typeTest[i].typeCheck(value)) {
        typeTests.splice(i, 1);
        successfulTypeTests.push(typeTests[i]);
      }
    }
  }
  return { nullCount, undefinedCount, typeTests: successfulTypeTests };
}

export function runSingularTypeTests(values, typeTests: TypeTestInfo[]) {
  let undefinedCount = 0;
  let nullCount = 0;
  for (const value of values) {
    if (value === null) {
      nullCount += 1;
    }
    if (value === undefined) {
      undefinedCount += 1;
    }
    for (let i = typeTests.length - 1; i >= 0; i--) {
      if (!typeTests[i].typeCheck(value)) {
        typeTests.splice(i, 1);
      }
    }
  }
  return {
    nullCount,
    undefinedCount,
    typeTest: typeTests.length === 1 ? typeTests[0] : undefined,
  };
}
