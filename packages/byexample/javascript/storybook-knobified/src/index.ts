// TODO: Should probably mock @storybook/addon-knobs
import { action } from '@storybook/addon-actions';
import { text, boolean, number, object, array, color } from '@storybook/addon-knobs';

import PropTypes from 'prop-types';

import {
  ObjectType,
  DefaultTypeName,
  TypeInfo,
  extractTypeInfo,
  defaultTypeTests,
} from '@byexample/types';
import { isCssColor } from 'css-color-checker';

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
        return array(key, value ? value : []);
      case DefaultTypeName.function:
        return action(key);
      case DefaultTypeName.object:
      default:
        return object(key, value);
    }
  } else {
    return object(key, value);
  }
}

function knobOfField(value, fields, key) {
  return knobBasedOffExamples(value, fields[key], key);
}

function shimDefaultTypeTests(typeTests) {
  return Object.keys(typeTests).reduce((newTypeTests, key) => {
    newTypeTests[key] = {
      typeCheck: ({ example }) => {
        return typeTests[key].typeCheck(example);
      },
      value: (propData) => {
        const examples = propData.map(({ example }) => example);
        return typeTests[key].value(examples);
      },
    };
    return newTypeTests;
  }, {});
}

function withPropTypeCheck(typeCheck, expectedPropType) {
  function checkProps(data) {
    return typeCheck({ example: data.defaultProp }) || typeCheck(data);
  }
  return (data) => {
    const { propType } = data;
    if (propType) {
      return propTypeMatches(propType, expectedPropType) || checkProps(data);
    }
    return checkProps(data);
  };
}

function knobTypeTests(extractTypeInfoFn) {
  // TODO: Remove the any
  const defaultTests: any = defaultTypeTests(extractTypeInfoFn);
  const ogValueFn = defaultTests.string.value;
  defaultTests.string.value = (examples) => {
    const ogValue = ogValueFn(examples);
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

  const typeTests = shimDefaultTypeTests(defaultTests) as any;
  typeTests.string.typeCheck = withPropTypeCheck(
    typeTests.string.typeCheck,
    PropTypes.string,
  );
  typeTests.number.typeCheck = withPropTypeCheck(
    typeTests.number.typeCheck,
    PropTypes.number,
  );
  typeTests.boolean.typeCheck = withPropTypeCheck(
    typeTests.boolean.typeCheck,
    PropTypes.bool,
  );
  typeTests.object.typeCheck = withPropTypeCheck(
    typeTests.object.typeCheck,
    PropTypes.object,
  );
  typeTests.array.typeCheck = withPropTypeCheck(
    typeTests.array.typeCheck,
    PropTypes.array,
  );
  return typeTests;
}

function propKeys(examples, Component = {}) {
  const { propTypes = {}, defaultProps = {} } = Component as any;

  return new Set([
    ...Object.keys(propTypes ? propTypes : {}),
    ...Object.keys(defaultProps ? defaultProps : {}),
    ...examples.map((example) => Object.keys(example)).flat(),
  ]);
}

function extractKnobInfo(examples, Component = {}) {
  const { propTypes = {}, defaultProps = {} } = Component as any;
  const keys = propKeys(examples, Component);
  // Wasteful copying of proptype and default prop data
  const typeInfo = Array.from(keys.values()).reduce((datum, key) => {
    datum[key] = extractTypeInfo(
      examples.map((example) => ({
        example: example[key],
        propType: propTypes[key],
        defaultProp: defaultProps[key],
      })),
      knobTypeTests(extractKnobInfo),
    );
    return datum;
  }, {});
  return typeInfo;
}

export function knobified(example, typeInfo, _options: any = {}) {
  const { types, nullCount, undefinedCount } = typeInfo;
  if (types.length <= 0) {
    return;
  }
  if (types.length > 1) {
    throw new Error(
      `Expecting root values to be object types. Root value types included [ ${types
        .map((type) => type.name)
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
    knobified[fieldKey] = knobOfField(example[fieldKey], rootType.fields, fieldKey);
    return knobified;
  }, {});
}

export function fromExamples(examples: any | any[], Component?: React.Component) {
  if (!Array.isArray(examples)) {
    examples = [examples];
  }
  const objectFields = extractKnobInfo(examples, Component);
  const typeInfo = {
    types: [
      {
        name: DefaultTypeName.object,
        fields: objectFields,
      },
    ],
    nullCount: 0,
    undefinedCount: 0,
  };
  return {
    knobified: (example) => {
      return knobified(example, typeInfo);
    },
  };
}
