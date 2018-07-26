'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.knobify = knobify;

var _addonKnobs = require('@storybook/addon-knobs');

var _types = require('@by-example/types');

var _cssColorChecker = require('css-color-checker');

var _propTypes = _interopRequireDefault(require('prop-types'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// TODO: Should probably mock @storybook/addon-knobs
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
} // TODO: Could probably refactor this to be less verbose

function knobBasedOffPropType(value, propType) {
  let knob = undefined;

  if (propTypeMatches(propType, _propTypes.default.string)) {
    knob = (0, _addonKnobs.text)(value);
  } else if (propTypeMatches(propType, _propTypes.default.number)) {
    knob = (0, _addonKnobs.number)(value);
  } else if (propTypeMatches(propType, _propTypes.default.bool)) {
    knob = (0, _addonKnobs.boolean)(value);
  } else if (propTypeMatches(propType, _propTypes.default.object)) {
    knob = (0, _addonKnobs.object)(value);
  } else if (propTypeMatches(propType, _propTypes.default.array)) {
    knob = (0, _addonKnobs.array)(value);
  }

  return knob;
}

function knobBasedOffExamples(value, typeInfo) {
  let knob = undefined;

  if (typeInfo.types.length === 1) {
    switch (typeInfo.types[0].name) {
      case _types.DefaultTypeName.number:
        knob = (0, _addonKnobs.number)(value);
        break;

      case _types.DefaultTypeName.boolean:
        knob = (0, _addonKnobs.boolean)(value);
        break;

      case _types.DefaultTypeName.string:
        // TODO: Check if color
        if ((0, _cssColorChecker.isCssColor)(value)) {
          knob = (0, _addonKnobs.color)(value);
        } else {
          knob = (0, _addonKnobs.text)(value);
        }

        break;

      case _types.DefaultTypeName.array:
        knob = (0, _addonKnobs.array)(value);
        break;

      case _types.DefaultTypeName.object:
      default:
        knob = (0, _addonKnobs.object)(value);
        break;
    }
  } else {
    knob = (0, _addonKnobs.object)(value);
  }

  return knob;
}

function knobifyField(example, objectType, propType, key) {
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

function knobify(examples, typeInfo, propTypes) {
  const { types, nullCount, undefinedCount } = typeInfo;

  if (types.length <= 0) {
    return;
  }

  if (types.length > 1) {
    throw new Error(
      `Was expect object types only but root value of examples included [ ${types
        .map(type => type.name)
        .join(', ')} ]`,
    );
  }

  const type = types[0];

  if (type.name !== _types.DefaultTypeName.object) {
    throw new Error(
      `Expected ${_types.DefaultTypeName.object} but received ${type.name}`,
    );
  }

  if (nullCount > 0 || undefinedCount > 0) {
    throw new Error('No null or undefined examples are allowed');
  }

  const rootType = type;

  for (const example of examples) {
    Object.keys(example).forEach(key => {
      // TODO: prop types
      knobifyField(example, rootType, propTypes, key);
    });
  }
}
