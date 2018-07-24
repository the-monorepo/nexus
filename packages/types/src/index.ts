import {
  isBoolean,
  isObject,
  isArray,
  isString,
  isFunction,
  isNumber,
} from './type-checks';
import { DefaultTypeName } from './DefaultTypeName';

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

type DefaultTypeNameInfo = {
  readonly type: DefaultTypeName;
};

export function DefaultTypeNameTests(values): TypeTestInfo<DefaultTypeNameInfo>[] {
  return [
    typeTest(isBoolean, () => ({ type: DefaultTypeName.boolean })),
    typeTest(isString, () => ({ type: DefaultTypeName.string })),
    typeTest(isFunction, () => ({ type: DefaultTypeName.function })),
    typeTest(isNumber, () => ({
      type: DefaultTypeName.number,
      format: () => (allAreIntegers(values) ? 'integer' : 'number'),
    })),
    typeTest(isArray, () => ({
      type: DefaultTypeName.array,
    })),
    typeTest(isObject, () => ({
      type: DefaultTypeName.object,
    })),
  ];
}

type ExtractedTypes = {
  nullCount: number;
  undefinedCount: number;
  typeValues: DefaultTypeNameInfo[];
};

export function extractTypeInfo(values): ExtractedTypes {
  const { nullCount, undefinedCount, typeValues } = runTypeTests(
    values,
    DefaultTypeNameTests(values),
  );
  return {
    nullCount,
    undefinedCount,
    typeValues: typeValues.map(callback => callback()),
  };
}

export function nullCounts(values: any[]): number {
  return values.filter(value => value === null).length;
}

export function undefinedCounts(values: any[]): number {
  return values.filter(value => value === undefined).length;
}

export function runTypeTests(
  values,
  typeTests: TypeTestInfo[] = DefaultTypeNameTests(values),
) {
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
