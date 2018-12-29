// TODO: Should probably mock @storybook/addon-knobs
import { text, boolean, number, object, array, color } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import {
  ObjectType,
  DefaultTypeName,
  TypeInfo,
  extractTypeInfo,
  defaultTypeTests,
  typeTest,
} from '@by-example/types';
import { isCssColor } from 'css-color-checker';
import PropTypes from 'prop-types';
import { runTypeTests } from '@by-example/types/src/runTypeTests';
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

export const isCssColorSymb = Symbol('isCssColor');

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
        return type[isCssColorSymb] ? color(key, value) : text(key, value);
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
  return knobBasedOffExamples(value, objectType.fields[key], key);
}

function addPropTypeCheck(typeTest, expectedPropType) {
  return ({ example, propType }) => {
    return propTypeMatches(propType, expectedPropType) || typeTest(example);
  };
}

function knobTypeTests(examples, extractTypeInfoFn, Component) {
  // TODO: Remove the any
  const typeTests: any = defaultTypeTests(examples, extractTypeInfoFn);
  const ogValueFn = typeTests.string.value;
  typeTests.string.value = () => {
    const ogValue = ogValueFn();
    let isColor = true;
    for (const example of examples) {
      if (example !== undefined && example !== null && !isCssColor(example)) {
        isColor = false;
        break;
      }
    }
    return {
      ...ogValue,
      [isCssColorSymb]: isColor,
    };
  };
  typeTests.string.typeTest = addPropTypeCheck(
    typeTests.string.typeTest,
    PropTypes.string,
  );
  typeTests.number.typeTest = addPropTypeCheck(
    typeTests.number.typeTest,
    PropTypes.number,
  );
  typeTests.boolean.typeTest = addPropTypeCheck(
    typeTests.boolean.typeTest,
    PropTypes.bool,
  );
  typeTests.object.typeTest = addPropTypeCheck(
    typeTests.object.typeTest,
    PropTypes.object,
  );
  typeTests.array.typeTest = addPropTypeCheck(typeTests.array.typeTest, PropTypes.array);
  return typeTests;
}

export function fromExamples(examples, Component, options) {
  const typeInfo = extractTypeInfo(examples, (examples, extractTypeInfo) =>
    knobTypeTests(examples, extractTypeInfo, Component),
  );

  return {
    knobified: example => {
      return knobified(example, typeInfo, Component.propTypes, options);
    },
  };
}

export function knobified(
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
