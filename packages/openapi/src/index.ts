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

function mapType(type: Type) {
  const byExampleToSwaggerTypeMap: {
    [key: string]: (type: Type) => any;
  } = {
    object: (objectType: ObjectType) => {
      const schema: any = {};
      schema.type = 'object';
      const properties = {};
      Object.keys(objectType.fields).forEach(key => {
        const fieldTypeInfo = objectType.fields[key];
        properties[key] = createSchema(fieldTypeInfo);
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
  return byExampleToSwaggerTypeMap[type.name](type);
}

export function createSchema(typeInfo: TypeInfo) {
  const swaggerTypes = typeInfo.types.map(mapType);
  let schema = undefined;
  if (swaggerTypes.length > 1) {
    schema = { oneOf: swaggerTypes };
  } else if (swaggerTypes.length === 1) {
    schema = swaggerTypes[0];
  }
  return schema;
}
