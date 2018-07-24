import { extractTypeInfo, DefaultType } from '@by-example/types';
export function createSchema(examples) {
  const { typeValues } = extractTypeInfo(examples);
  let knob;
  if (typeValues.length === 1) {
    switch (typeValues[0].type) {
      case DefaultType.number:
        knob = number();
      case DefaultType.boolean:
        knob = boolean();
      case DefaultType.string:
        // TODO: Check if color
        knob = text();
      case DefaultType.array:
        knob = array();
      case DefaultType.object:
      default:
        knob = object();
    }
  } else {
    knob = object();
  }
  return knob;
}
