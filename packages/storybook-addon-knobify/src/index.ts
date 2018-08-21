// TODO: Should probably mock @storybook/addon-knobs
import { text, boolean, number, object, array, color } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { ObjectType, DefaultTypeName, TypeInfo } from '@by-example/types';
import { isCssColor } from 'css-color-checker';
import PropTypes from 'prop-types';
function propTypeMatches(testedPropType, expectedPropType) {
  if (testedPropType === expectedPropType) {
    return true;
  } else if (
    expectedPropType.isRequired &&
    expectedPropType.isRequired === testedPropType
  ) {
    return true;
  } else {
    return false;
  }
}

// TODO: Could probably refactor this to be less verbose
function knobBasedOffPropType(value, propType) {
  let knob = undefined;
  if (propTypeMatches(propType, PropTypes.string)) {
    knob = text(value);
  } else if (propTypeMatches(propType, PropTypes.number)) {
    knob = number(value);
  } else if (propTypeMatches(propType, PropTypes.bool)) {
    knob = boolean(value);
  } else if (propTypeMatches(propType, PropTypes.object)) {
    knob = object(value);
  } else if (propTypeMatches(propType, PropTypes.array)) {
    knob = array(value);
  }
  return knob;
}

function knobBasedOffExamples(value, typeInfo: TypeInfo) {
  let knob = undefined;
  if (typeInfo.types.length === 1) {
    switch (typeInfo.types[0].name) {
      case DefaultTypeName.number:
        knob = number(value);
        break;
      case DefaultTypeName.boolean:
        knob = boolean(value);
        break;
      case DefaultTypeName.string:
        if (isCssColor(value)) {
          knob = color(value);
        } else {
          knob = text(value);
        }
        break;
      case DefaultTypeName.array:
        knob = array(value);
        break;
      case DefaultTypeName.function:
        knob = action(value);
        break;
      case DefaultTypeName.object:
      default:
        knob = object(value);
        break;
    }
  } else {
    knob = object(value);
  }
  return knob;
}

function knobifyField(example, objectType: ObjectType, propType, key) {
  const value = example[key];
  let knob = undefined;
  if (propType) {
    knob = knobBasedOffPropType(value, propType);
  }
  if (!knob) {
    knob = knobBasedOffExamples(value, objectType.fields[key]);
  }
  example[key] = knob;
}

export function knobify(
  examples: any[],
  typeInfo: TypeInfo,
  propTypes?: { [key: string]: any },
  options: any = {},
) {
  const { types, nullCount, undefinedCount } = typeInfo;
  if (types.length <= 0) {
    return;
  }
  if (types.length > 1) {
    throw new Error(
      `Expecting root values to be object types. Root value types included [ ${types
        .map(type => type.name)
        .join(', ')} ]`,
    );
  }
  const type = types[0];
  if (type.name !== DefaultTypeName.object) {
    throw new Error(`Expected ${DefaultTypeName.object} but received ${type.name}`);
  }
  if (nullCount > 0 || undefinedCount > 0) {
    throw new Error('No null or undefined examples are allowed');
  }
  const rootType: ObjectType = type as ObjectType;
  for (const example of examples) {
    Object.keys(example).forEach(key => {
      // TODO: prop types
      knobifyField(example, rootType, propTypes, key);
    });
  }
}
