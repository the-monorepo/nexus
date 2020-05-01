"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchema = createSchema;
exports.fromTypes = fromTypes;

var _types = require("@byexample/types");

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
  const byExampleToSwaggerTypeMap = {
    object: objectType => {
      const properties = {};
      const required = [];

      if (options.assumeRequired) {
        Object.keys(objectType.fields).forEach(key => {
          const fieldTypeInfo = objectType.fields[key];

          if (fieldTypeInfo.undefinedCount <= 0) {
            required.push(key);
          }
        });
      }

      Object.keys(objectType.fields).forEach(key => {
        const fieldTypeInfo = objectType.fields[key];
        properties[key] = createSchema(fieldTypeInfo, options);
      });
      const schema = {
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
      if (type.format === _types.NumberFormat.integer) {
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
  const mapped = byExampleToSwaggerTypeMap[type.name](type);
  addTypeInfoToOpenSchema(mapped, typeInfo, options);
  return mapped;
}

function createSchema(typeInfo, options = {}) {
  const optionsWithDefaults = {
    assumeRequired: true,
    assumeNonNull: true,
    ...options
  };
  const swaggerTypes = typeInfo.types.map(type => mapType(type, typeInfo, optionsWithDefaults));
  let schema = undefined;

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

function fromTypes(typeInfo) {
  return createSchema(typeInfo);
}
//# sourceMappingURL=index.js.map
