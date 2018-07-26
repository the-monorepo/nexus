'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.objectTypeToSwagger = objectTypeToSwagger;
exports.createSchema = createSchema;

function objectTypeToSwagger(objectType, typeToSwaggerMap) {
  const schema = {};
  schema.type = 'object';
  const properties = {};
  Object.keys(objectType.fields).forEach(key => {
    const fieldType = objectType.fields[key];
    properties[key] = typeToSwaggerMap[key](fieldType);
  });
  return schema;
}

function mapType(type) {
  const byExampleToSwaggerTypeMap = {
    object: type => objectTypeToSwagger(type, byExampleToSwaggerTypeMap),
    string: type => 'string',
    array: type => 'array',
    number: type => (type.format === 'integer' ? 'integer' : 'number'),
    boolean: type => 'boolean',
  };
  return byExampleToSwaggerTypeMap[type.name](type);
}

function createSchema(typeInfo) {}
