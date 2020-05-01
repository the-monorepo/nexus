import {
  TypeInfo,
  ObjectType,
  StringType,
  NumberType,
  ArrayType,
  BooleanType,
  Type,
  NumberFormat,
} from '@byexample/types';

function addTypeInfoToOpenSchema(openApiType, typeInfo, options) {
  if (options.assumeNonNull) {
    if (typeInfo.nullCount > 0) {
      openApiType.nullable = true;
    }
  } else {
    openApiType.nullable = true;
  }
}

function mapType(type: Type, typeInfo: TypeInfo, options) {
  const byExampleToSwaggerTypeMap: {
    [key: string]: (type: Type) => any;
  } = {
    object: (objectType: ObjectType) => {
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
      const schema: any = {
        type: 'object',
        properties,
      };
      if (required.length > 0) {
        schema.required = required;
      }
      return schema;
    },
    string: (type: StringType) => {
      return { type: 'string' };
    },
    array: (type: ArrayType) => {
      return {
        type: 'array',
        items: createSchema(type.items, options),
      };
    },
    number: (type: NumberType) => {
      if (type.format === NumberFormat.integer) {
        return { type: 'integer' };
      } else {
        return { type: 'number' };
      }
    },
    boolean: (type: BooleanType) => {
      return { type: 'boolean' };
    },
  };
  const mapped = byExampleToSwaggerTypeMap[type.name](type);
  addTypeInfoToOpenSchema(mapped, typeInfo, options);
  return mapped;
}

export function createSchema(typeInfo: TypeInfo, options = {}) {
  const optionsWithDefaults = {
    assumeRequired: true,
    assumeNonNull: true,
    ...options,
  };

  const swaggerTypes = typeInfo.types.map(type =>
    mapType(type, typeInfo, optionsWithDefaults),
  );
  let schema = undefined;
  if (swaggerTypes.length > 1) {
    schema = { oneOf: swaggerTypes };
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
