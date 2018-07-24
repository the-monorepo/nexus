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

type TypeTestInfo<V = any> = {
  readonly typeCheck: (...params: any[]) => boolean;
  readonly value: V;
};
export function typeTest(typeCheck: TypeCheck, value): TypeTestInfo {
  return { typeCheck, value };
}

type TypeChecks = {
  [key: string]: TypeCheck;
};

export enum DefaultType {
  boolean = 'boolean',
  string = 'string',
  function = 'function',
  number = 'number',
  array = 'array',
  object = 'object'
}

type DefaultTypeInfo = {
  readonly type: DefaultType;
}

export function defaultTypeTests(values): TypeTestInfo<DefaultTypeInfo>[] {
  return [
    typeTest(isBoolean, () => ({ type: DefaultType.boolean })),
    typeTest(isString, () => ({ type: DefaultType.string })),
    typeTest(isFunction, () => ({ type: DefaultType.function })),
    typeTest(isNumber, () => ({
      type: DefaultType.number,
      format: () => allAreIntegers(values) ? 'integer' : 'number',
    })),
    typeTest(isArray, () => ({
      type: DefaultType.array,
    })),
    typeTest(isObject, () => ({
      type: DefaultType.object,
    })),
  ];
}

type ExtractedTypes = {
  nullCount: number;
  undefinedCount: number;
  typeValues: DefaultTypeInfo[]
}

export function extractTypeInfo(values): ExtractedTypes {
  const { nullCount, undefinedCount, typeValues } = runTypeTests(values, defaultTypeTests(values));
  return {
    nullCount,
    undefinedCount,
    typeValues: typeValues.map((callback) => callback())
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
