'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.allAreIntegers = allAreIntegers;
exports.defaultTypeTests = defaultTypeTests;

var _DefaultTypeName = require('./DefaultTypeName');

var _typeChecks = require('./type-checks');

var _typeInfoTypes = require('./type-info-types');

var _TypeTest = require('./TypeTest');

function allAreIntegers(values) {
  for (const value of values) {
    if (!Number.isInteger(value)) {
      return false;
    }
  }

  return true;
}

function defaultTypeTests(values, extractTypeInfoFunction) {
  return [
    (0, _TypeTest.typeTest)(_typeChecks.isBoolean, () => {
      const type = {
        type: _DefaultTypeName.DefaultTypeName.boolean,
      };
      return type;
    }),
    (0, _TypeTest.typeTest)(_typeChecks.isString, () => {
      const type = {
        type: _DefaultTypeName.DefaultTypeName.string,
      };
      return type;
    }),
    (0, _TypeTest.typeTest)(_typeChecks.isFunction, () => {
      const type = {
        type: _DefaultTypeName.DefaultTypeName.function,
      };
      return type;
    }),
    (0, _TypeTest.typeTest)(_typeChecks.isNumber, () => {
      const type = {
        type: _DefaultTypeName.DefaultTypeName.number,
        format: allAreIntegers(values)
          ? _typeInfoTypes.NumberFormat.integer
          : _typeInfoTypes.NumberFormat.none,
      };
      return type;
    }),
    (0, _TypeTest.typeTest)(_typeChecks.isArray, () => {
      /*
     * TODO: Currently doesn't necessarily behave as expected.
     * E.g. Examples = [[1, 1, 1], ['', '', '']] will return a type 
     * that expects an array of both strings and numbers
     */
      const arrayValues = values.filter(value => (0, _typeChecks.isArray)(value));
      const allValues = [].concat(...arrayValues);
      const items = extractTypeInfoFunction(allValues);
      const type = {
        type: _DefaultTypeName.DefaultTypeName.array,
        // TODO: This currently will only extract default types
        // TODO: Should probably lazy load this
        items,
      };
      return type;
    }),
    (0, _TypeTest.typeTest)(_typeChecks.isObject, () => {
      const objectValues = values.filter(value => (0, _typeChecks.isObject)(value));
      const keyToValuesMap = {}; // Gather the values for each key

      objectValues.forEach(objectValue => {
        Object.keys(objectValue).forEach(key => {
          if (keyToValuesMap[key] === undefined) {
            keyToValuesMap[key] = [];
          }

          keyToValuesMap[key].push(objectValue[key]);
        });
      });
      const fields = {};
      Object.keys(keyToValuesMap).forEach(key => {
        const values = keyToValuesMap[key];
        fields[key] = extractTypeInfoFunction(values);
      });
      const type = {
        type: _DefaultTypeName.DefaultTypeName.object,
        fields, // TODO: Should probably lazy load this
      };
      return type;
    }),
  ];
}
