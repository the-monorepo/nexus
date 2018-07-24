import { text, boolean, number, object, array } from '@storybook/addon-knobs';
import { extractTypeInfo, DefaultType } from '@by-example/types';

export function knobify(examples: any[]) {
  const { typeValues } = extractTypeInfo(examples);
  if (typeValues.length === 1) {
    return value => object(value);
  } else if (typeValues.length > 1) {
    return value => object(value);
  } else {
    // No types = No idea what type it is, just return the original value
    return value => value;
  }
  return function wrapWithKnob(example) {
    const { types } = extractTypeInfo(examples);
    let knob;
    if (types.length === 1) {
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
  };
}
