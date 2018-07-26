import {
  TypeInfo,
  ObjectType,
  StringType,
  NumberType,
  ArrayType,
  BooleanType,
  Type,
} from '@by-example/types';

export function objectTypeToSwagger(objectType: ObjectType, typeToSwaggerMap) {
  const schema: any = {};
  schema.type = 'object';
  const properties = {};
  Object.keys(objectType.fields).forEach(key => {
    const fieldType = objectType.fields[key];
    properties[key] = typeToSwaggerMap[key](fieldType);
  });
  return schema;
}

function mapType(type: Type) {
  const byExampleToSwaggerTypeMap: {
    [key: string]: (type: Type) => any;
  } = {
    object: (type: ObjectType) => objectTypeToSwagger(type, byExampleToSwaggerTypeMap),
    string: (type: StringType) => 'string',
    array: (type: ArrayType) => 'array',
    number: (type: NumberType) => (type.format === 'integer' ? 'integer' : 'number'),
    boolean: (type: BooleanType) => 'boolean',
  };
  return byExampleToSwaggerTypeMap[type.name](type);
}

export function createSchema(typeInfo: TypeInfo) {}
