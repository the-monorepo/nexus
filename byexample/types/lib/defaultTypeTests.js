"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultTypeTests = defaultTypeTests;

var _DefaultTypeName = require("./DefaultTypeName");

var _typeChecks = require("./type-checks");

var _typeInfoTypes = require("./type-info-types");

var _TypeTest = require("./TypeTest");

var _util = require("./util");

var _extractTypeInfo = require("./extractTypeInfo");

function defaultTypeTests(extractTypeInfoFunction = _extractTypeInfo.extractTypeInfo) {
  return {
    boolean: (0, _TypeTest.typeTest)(_typeChecks.isBoolean, () => {
      const type = {
        name: _DefaultTypeName.DefaultTypeName.boolean
      };
      return type;
    }),
    string: (0, _TypeTest.typeTest)(_typeChecks.isString, () => {
      const type = {
        name: _DefaultTypeName.DefaultTypeName.string
      };
      return type;
    }),
    function: (0, _TypeTest.typeTest)(_typeChecks.isFunction, () => {
      const type = {
        name: _DefaultTypeName.DefaultTypeName.function
      };
      return type;
    }),
    number: (0, _TypeTest.typeTest)(_typeChecks.isNumber, values => {
      const type = {
        name: _DefaultTypeName.DefaultTypeName.number,
        format: (0, _util.allAreIntegers)(values.filter(_typeChecks.isNumber)) ? _typeInfoTypes.NumberFormat.integer : _typeInfoTypes.NumberFormat.none
      };
      return type;
    }),
    array: (0, _TypeTest.typeTest)(_typeChecks.isArray, values => {
      /*
       * TODO: Currently doesn't necessarily behave as expected.
       * E.g. Examples = [[1, 1, 1], ['', '', '']] will return a type
       * that expects an array of both strings and numbers
       */
      const arrayValues = values.filter(value => (0, _typeChecks.isArray)(value));
      const allValues = [].concat(...arrayValues);
      const items = extractTypeInfoFunction(allValues);
      const type = {
        name: _DefaultTypeName.DefaultTypeName.array,
        items
      };
      return type;
    }),
    object: (0, _TypeTest.typeTest)(_typeChecks.isObject, values => {
      const objectValues = values.filter(value => (0, _typeChecks.isObject)(value));
      const keyToValuesMap = new Map();
      objectValues.forEach(objectValue => {
        Object.keys(objectValue).forEach(key => {
          keyToValuesMap.set(key, []);
        });
      }); // Gather the values for each key

      for (const key of keyToValuesMap.keys()) {
        objectValues.forEach(objectValue => {
          keyToValuesMap.get(key).push(objectValue[key]);
        });
      } // Extract the type info of each field


      const fields = {};

      for (const [key, fieldValues] of keyToValuesMap.entries()) {
        fields[key] = extractTypeInfoFunction(fieldValues);
      } // Chuck everything into an object type


      const type = {
        name: _DefaultTypeName.DefaultTypeName.object,
        fields // TODO: Should probably lazy load this

      };
      return type;
    })
  };
}
//# sourceMappingURL=defaultTypeTests.js.map
