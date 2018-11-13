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
function knobBasedOffPropType(value, propType, key) {
  if (propTypeMatches(propType, PropTypes.string)) {
    return text(key, value);
  } else if (propTypeMatches(propType, PropTypes.number)) {
    return number(key, value);
  } else if (propTypeMatches(propType, PropTypes.bool)) {
    return boolean(key, value);
  } else if (propTypeMatches(propType, PropTypes.object)) {
    return object(key, value);
  } else if (propTypeMatches(propType, PropTypes.array)) {
    return array(key, value);
  }
}

function knobBasedOffExamples(value, typeInfo: TypeInfo, key) {
  console.log(value);
  console.log(typeInfo);
  if (typeInfo.types.length === 1) {
    const type = typeInfo.types[0];
    switch (type.name) {
      case DefaultTypeName.number:
        return number(key, value);
      case DefaultTypeName.boolean:
        return boolean(key, value);
      case DefaultTypeName.string:
        if (isCssColor(value)) {
          return color(key, value);
        } else {
          return text(key, value);
        }
      case DefaultTypeName.array:
        return array(key, !!value ? value : []);
      case DefaultTypeName.function:
        return action(key, value);
      case DefaultTypeName.object:
      default:
        return object(key, value);
    }
  } else {
    return object(key, value);
  }
}

function knobOfField(value, objectType: ObjectType, propType, key) {
  let knob = undefined;
  console.log(key);
  if (propType) {
    console.log('prop types');
    knob = knobBasedOffPropType(value, propType, key);
  }
  if (!knob) {
    console.log('examples');
    knob = knobBasedOffExamples(value, objectType.fields[key], key);
  }
  console.log('\n');
  return knob;
}

export function knobify(
  example,
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
  return Object.keys(rootType.fields).reduce((knobified, fieldKey) => {
    knobified[fieldKey] = knobOfField(example[fieldKey], rootType, propTypes, fieldKey);
    return knobified;
  }, {});
}
