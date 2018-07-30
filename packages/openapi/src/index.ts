import {
  TypeInfo,
  ObjectType,
  StringType,
  NumberType,
  ArrayType,
  BooleanType,
  Type,
  NumberFormat,
} from '@by-example/types';

function mapType(type: Type, typeInfo: TypeInfo, options) {
  const byExampleToSwaggerTypeMap: {
    [key: string]: (type: Type) => any;
  } = {
    object: (objectType: ObjectType) => {
      const schema: any = {};
      schema.type = 'object';
      const properties = {};
      Object.keys(objectType.fields).forEach(key => {
        const fieldTypeInfo = objectType.fields[key];
        properties[key] = createSchema(fieldTypeInfo, options);
      });
      schema.properties = properties;
      return schema;
    },
    string: (type: StringType) => {
      return { type: 'string' };
    },
    array: (type: ArrayType) => {
      return { type: 'array' };
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
  if (options.assumeRequired) {
    if (typeInfo.undefinedCount <= 0) {
      mapped.required = true;
    }
  }
  if (options.assumeNonNull) {
    if (typeInfo.nullCount > 0) {
      mapped.nullable = true;
    }
  } else {
    mapped.nullable = true;
  }
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
  }
  return schema;
}
