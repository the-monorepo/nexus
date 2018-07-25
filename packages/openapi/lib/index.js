'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.createSchema = createSchema;

var _types = require('@by-example/types');

function createSchema(examples) {
  const { typeValues } = (0, _types.extractTypeInfo)(examples);
  let knob;

  if (typeValues.length === 1) {
    switch (typeValues[0].type) {
      case _types.DefaultType.number:
        knob = number();

      case _types.DefaultType.boolean:
        knob = boolean();

      case _types.DefaultType.string:
        // TODO: Check if color
        knob = text();

      case _types.DefaultType.array:
        knob = array();

      case _types.DefaultType.object:
      default:
        knob = object();
    }
  } else {
    knob = object();
  }

  return knob;
}
