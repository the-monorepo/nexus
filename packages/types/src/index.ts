import {
  isBoolean,
  isObject,
  isArray,
  isString,
  isFunction,
  isNumber,
} from './type-checks';
import { DefaultTypeName } from './DefaultTypeName';
import {
  Type,
  DefaultTypeInfo,
  DefaultType,
  BooleanType,
  StringType,
  FunctionType,
  NumberType,
  NumberFormat,
  ArrayType,
  ObjectType,
} from './type-info-types';

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

export function typeTest<T>(typeCheck: TypeCheck, value: T): TypeTestInfo<T> {
  return { typeCheck, value };
}

export function DefaultTypeNameTests(values): TypeTestInfo<() => DefaultType>[] {
  return [
    typeTest(isBoolean, () => {
      const type: BooleanType = { type: DefaultTypeName.boolean };
      return type;
    }),
    typeTest(isString, () => {
      const type: StringType = { type: DefaultTypeName.string };
      return type;
    }),
    typeTest(isFunction, () => {
      const type: FunctionType = { type: DefaultTypeName.function };
      return type;
    }),
    typeTest(isNumber, () => {
      const type: NumberType = {
        type: DefaultTypeName.number,
        format: allAreIntegers(values) ? NumberFormat.integer : NumberFormat.number,
      };
      return type;
    }),
    typeTest(isArray, () => {
      const type: ArrayType = {
        type: DefaultTypeName.array,
        items: [],
      };
      return type;
    }),
    typeTest(isObject, () => {
      const objectValues = values.filter(value => isObject(value));
      const keyToValuesMap: { [key: string]: any[] } = {};
      // Gather the values for each key
      objectValues.forEach(objectValue => {
        Object.keys(objectValue).forEach(key => {
          if (objectValue[key] === undefined) {
            objectValue[key] = [];
          }
          keyToValuesMap[key].push(objectValue[key]);
        });
      });

      const fields = {};
      Object.keys(keyToValuesMap).forEach(key => {
        const values = keyToValuesMap[key];
        fields[key] = extractTypeInfo(values);
      });
      const type: ObjectType = {
        type: DefaultTypeName.object,
        fields,
      };
      return type;
    }),
  ];
}

export function extractTypeInfo(values): DefaultTypeInfo {
  const { nullCount, undefinedCount, typeValues } = runTypeTests(
    values,
    DefaultTypeNameTests(values),
  );
  const types: DefaultType[] = typeValues.map(callback => callback());
  return {
    nullCount,
    undefinedCount,
    types,
  };
}

export function nullCounts(values: any[]): number {
  return values.filter(value => value === null).length;
}

export function undefinedCounts(values: any[]): number {
  return values.filter(value => value === undefined).length;
}

export function runTypeTests<V = Type>(values, typeTests: TypeTestInfo<V>[]) {
  const undefinedCount = undefinedCounts(values);
  const nullCount = nullCounts(values);
  const coppiedTypeTests = [...typeTests];
  for (const value of values) {
    for (let i = coppiedTypeTests.length - 1; i >= 0; i--) {
      if (!coppiedTypeTests[i].typeCheck(value)) {
        coppiedTypeTests.splice(i, 1);
      }
    }
  }
  return {
    nullCount,
    undefinedCount,
    typeValues: coppiedTypeTests.map(({ value }) => value),
  };
}
