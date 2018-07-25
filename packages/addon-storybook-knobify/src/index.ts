// TODO: Should probably mock @storybook/addon-knobs
import { text, boolean, number, object, array, color } from '@storybook/addon-knobs';
import { TypeInfo, DefaultTypeName } from '@by-example/types';
import { isCssColor } from 'css-color-checker';
export function knobifyField(example, fieldTypeInfos: TypeInfo, key) {
  const value = example[key];
  const typeInfo = fieldTypeInfos[key];
  let knob = undefined;
  if (typeInfo.types.length === 1) {
    switch (typeInfo.types[0].type) {
      case DefaultTypeName.number:
        knob = number(value);
        break;
      case DefaultTypeName.boolean:
        knob = boolean(value);
        break;
      case DefaultTypeName.string:
        // TODO: Check if color
        if (isCssColor(value)) {
          knob = color(value);
        } else {
          knob = text(value);
        }
        break;
      case DefaultTypeName.array:
        knob = array(value);
        break;
      case DefaultTypeName.object:
      default:
        knob = object(value);
        break;
    }
  } else {
    knob = object(value);
  }
  example[key] = knob;
}

export function knobify(examples: any[], typeInfo: TypeInfo) {
  const { types, nullCount, undefinedCount } = typeInfo;
  if (types.length <= 0) {
    return;
  } else if (types.length > 1 || types[0].type !== DefaultTypeName.object) {
    throw new Error('Examples were not objects');
  } else if (nullCount > 0 || undefinedCount > 0) {
    throw new Error('No null or undefined examples are allowed');
  }
  const rootType = types[0];
  for (const example of examples) {
    Object.keys(example).forEach(key => {
      knobifyField(example, rootType.fields, key);
    });
  }
}
