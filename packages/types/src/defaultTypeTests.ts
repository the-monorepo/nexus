import { DefaultTypeName } from './DefaultTypeName';
import {
  isBoolean,
  isObject,
  isArray,
  isString,
  isFunction,
  isNumber,
} from './type-checks';
import {
  DefaultType,
  BooleanType,
  StringType,
  FunctionType,
  NumberType,
  NumberFormat,
  ArrayType,
  ObjectType,
} from './type-info-types';
import { typeTest, TypeTest } from './TypeTest';
import { allAreIntegers } from './util';
import { extractTypeInfo } from './extractTypeInfo';

export function defaultTypeTests(examples, extractTypeInfoFunction = extractTypeInfo) {
  return {
    boolean: typeTest(isBoolean, () => {
      const type: BooleanType = { name: DefaultTypeName.boolean };
      return type;
    }),
    string: typeTest(isString, () => {
      const type: StringType = { name: DefaultTypeName.string };
      return type;
    }),
    function: typeTest(isFunction, () => {
      const type: FunctionType = { name: DefaultTypeName.function };
      return type;
    }),
    number: typeTest(isNumber, () => {
      const type: NumberType = {
        name: DefaultTypeName.number,
        format: allAreIntegers(examples.filter(isNumber))
          ? NumberFormat.integer
          : NumberFormat.none,
      };
      return type;
    }),
    array: typeTest(isArray, () => {
      /*
       * TODO: Currently doesn't necessarily behave as expected.
       * E.g. Examples = [[1, 1, 1], ['', '', '']] will return a type
       * that expects an array of both strings and numbers
       */
      const arrayValues = examples.filter(value => isArray(value));
      const allValues = [].concat(...arrayValues);
      const items = extractTypeInfoFunction(allValues);
      const type: ArrayType = {
        name: DefaultTypeName.array,
        items,
      };
      return type;
    }),
    object: typeTest(isObject, () => {
      const objectValues = examples.filter(value => isObject(value));
      const keyToValuesMap = new Map<string, { [k: string]: any }>();
      objectValues.forEach(objectValue => {
        Object.keys(objectValue).forEach(key => {
          keyToValuesMap.set(key, []);
        });
      });
      // Gather the values for each key
      for (const key of keyToValuesMap.keys()) {
        objectValues.forEach(objectValue => {
          keyToValuesMap.get(key).push(objectValue[key]);
        });
      }
      // Extract the type info of each field
      const fields = {};
      for (const [key, fieldValues] of keyToValuesMap.entries()) {
        fields[key] = extractTypeInfoFunction(fieldValues);
      }
      // Chuck everything into an object type
      const type: ObjectType = {
        name: DefaultTypeName.object,
        fields, // TODO: Should probably lazy load this
      };
      return type;
    }),
  };
}
