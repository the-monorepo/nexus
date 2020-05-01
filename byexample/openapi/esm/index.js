"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { NumberFormat } from '@byexample/types';

function addTypeInfoToOpenSchema(openApiType, typeInfo, options) {
  if (options.assumeNonNull) {
    if (typeInfo.nullCount > 0) {
      openApiType.nullable = true;
    }
  } else {
    openApiType.nullable = true;
  }
}

function mapType(type, typeInfo, options) {
  var byExampleToSwaggerTypeMap = {
    object: objectType => {
      var properties = {};
      var required = [];

      if (options.assumeRequired) {
        Object.keys(objectType.fields).forEach(key => {
          var fieldTypeInfo = objectType.fields[key];

          if (fieldTypeInfo.undefinedCount <= 0) {
            required.push(key);
          }
        });
      }

      Object.keys(objectType.fields).forEach(key => {
        var fieldTypeInfo = objectType.fields[key];
        properties[key] = createSchema(fieldTypeInfo, options);
      });
      var schema = {
        type: 'object',
        properties
      };

      if (required.length > 0) {
        schema.required = required;
      }

      return schema;
    },
    string: type => {
      return {
        type: 'string'
      };
    },
    array: type => {
      return {
        type: 'array',
        items: createSchema(type.items, options)
      };
    },
    number: type => {
      if (type.format === NumberFormat.integer) {
        return {
          type: 'integer'
        };
      } else {
        return {
          type: 'number'
        };
      }
    },
    boolean: type => {
      return {
        type: 'boolean'
      };
    }
  };
  var mapped = byExampleToSwaggerTypeMap[type.name](type);
  addTypeInfoToOpenSchema(mapped, typeInfo, options);
  return mapped;
}

export function createSchema(typeInfo) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var optionsWithDefaults = _objectSpread({
    assumeRequired: true,
    assumeNonNull: true
  }, options);

  var swaggerTypes = typeInfo.types.map(type => mapType(type, typeInfo, optionsWithDefaults));
  var schema = undefined;

  if (swaggerTypes.length > 1) {
    schema = {
      oneOf: swaggerTypes
    };
  } else if (swaggerTypes.length === 1) {
    schema = swaggerTypes[0];
  } else {
    schema = {};
    addTypeInfoToOpenSchema(schema, typeInfo, options);
  }

  return schema;
}
export function fromTypes(typeInfo) {
  return createSchema(typeInfo);
}
//# sourceMappingURL=index.js.map
