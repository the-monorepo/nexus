"use strict";

import { DefaultTypeName } from './DefaultTypeName';
import { isBoolean, isObject, isArray, isString, isFunction, isNumber } from './type-checks';
import { NumberFormat } from './type-info-types';
import { typeTest } from './TypeTest';
import { allAreIntegers } from './util';
import { extractTypeInfo } from './extractTypeInfo';
export function defaultTypeTests() {
  var extractTypeInfoFunction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : extractTypeInfo;
  return {
    boolean: typeTest(isBoolean, () => {
      var type = {
        name: DefaultTypeName.boolean
      };
      return type;
    }),
    string: typeTest(isString, () => {
      var type = {
        name: DefaultTypeName.string
      };
      return type;
    }),
    function: typeTest(isFunction, () => {
      var type = {
        name: DefaultTypeName.function
      };
      return type;
    }),
    number: typeTest(isNumber, values => {
      var type = {
        name: DefaultTypeName.number,
        format: allAreIntegers(values.filter(isNumber)) ? NumberFormat.integer : NumberFormat.none
      };
      return type;
    }),
    array: typeTest(isArray, values => {
      /*
       * TODO: Currently doesn't necessarily behave as expected.
       * E.g. Examples = [[1, 1, 1], ['', '', '']] will return a type
       * that expects an array of both strings and numbers
       */
      var arrayValues = values.filter(value => isArray(value));
      var allValues = [].concat(...arrayValues);
      var items = extractTypeInfoFunction(allValues);
      var type = {
        name: DefaultTypeName.array,
        items
      };
      return type;
    }),
    object: typeTest(isObject, values => {
      var objectValues = values.filter(value => isObject(value));
      var keyToValuesMap = new Map();
      objectValues.forEach(objectValue => {
        Object.keys(objectValue).forEach(key => {
          keyToValuesMap.set(key, []);
        });
      }); // Gather the values for each key

      var _loop = function _loop(key) {
        objectValues.forEach(objectValue => {
          keyToValuesMap.get(key).push(objectValue[key]);
        });
      };

      for (var key of keyToValuesMap.keys()) {
        _loop(key);
      } // Extract the type info of each field


      var fields = {};

      for (var [_key, fieldValues] of keyToValuesMap.entries()) {
        fields[_key] = extractTypeInfoFunction(fieldValues);
      } // Chuck everything into an object type


      var type = {
        name: DefaultTypeName.object,
        fields // TODO: Should probably lazy load this

      };
      return type;
    })
  };
}
//# sourceMappingURL=defaultTypeTests.js.map
