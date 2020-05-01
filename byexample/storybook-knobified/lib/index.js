"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromExamples = fromExamples;
exports.knobified = knobified;
exports.isCssColorSymb = void 0;

var _addonKnobs = require("@storybook/addon-knobs");

var _addonActions = require("@storybook/addon-actions");

var _types = require("@byexample/types");

var _cssColorChecker = require("css-color-checker");

var _propTypes = _interopRequireDefault(require("prop-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: Should probably mock @storybook/addon-knobs
function propTypeMatches(testedPropType, expectedPropType) {
  if (testedPropType === expectedPropType) {
    return true;
  } else if (expectedPropType.isRequired && expectedPropType.isRequired === testedPropType) {
    return true;
  } else {
    return false;
  }
}

const isCssColorSymb = Symbol('isCssColor');
exports.isCssColorSymb = isCssColorSymb;

function knobBasedOffExamples(value, typeInfo, key) {
  if (typeInfo.types.length === 1) {
    const type = typeInfo.types[0];

    switch (type.name) {
      case _types.DefaultTypeName.number:
        return (0, _addonKnobs.number)(key, value);

      case _types.DefaultTypeName.boolean:
        return (0, _addonKnobs.boolean)(key, value);

      case _types.DefaultTypeName.string:
        return type[isCssColorSymb] ? (0, _addonKnobs.color)(key, value) : (0, _addonKnobs.text)(key, value);

      case _types.DefaultTypeName.array:
        return (0, _addonKnobs.array)(key, !!value ? value : []);

      case _types.DefaultTypeName.function:
        return (0, _addonActions.action)(key, value);

      case _types.DefaultTypeName.object:
      default:
        return (0, _addonKnobs.object)(key, value);
    }
  } else {
    return (0, _addonKnobs.object)(key, value);
  }
}

function knobOfField(value, fields, key) {
  return knobBasedOffExamples(value, fields[key], key);
}

function shimDefaultTypeTests(typeTests) {
  return Object.keys(typeTests).reduce((newTypeTests, key) => {
    newTypeTests[key] = {
      typeCheck: ({
        example
      }) => {
        return typeTests[key].typeCheck(example);
      },
      value: propData => {
        const examples = propData.map(({
          example
        }) => example);
        return typeTests[key].value(examples);
      }
    };
    return newTypeTests;
  }, {});
}

function withPropTypeCheck(typeCheck, expectedPropType) {
  function checkProps(data) {
    return typeCheck({
      example: data.defaultProp
    }) || typeCheck(data);
  }

  return data => {
    const {
      propType
    } = data;

    if (propType) {
      return propTypeMatches(propType, expectedPropType) || checkProps(data);
    }

    return checkProps(data);
  };
}

function knobTypeTests(extractTypeInfoFn) {
  // TODO: Remove the any
  const defaultTests = (0, _types.defaultTypeTests)(extractTypeInfoFn);
  const ogValueFn = defaultTests.string.value;

  defaultTests.string.value = examples => {
    const ogValue = ogValueFn(examples);
    let isColor = true;

    for (const example of examples) {
      if (example !== undefined && example !== null && !(0, _cssColorChecker.isCssColor)(example)) {
        isColor = false;
        break;
      }
    }

    return { ...ogValue,
      [isCssColorSymb]: isColor
    };
  };

  const typeTests = shimDefaultTypeTests(defaultTests);
  typeTests.string.typeCheck = withPropTypeCheck(typeTests.string.typeCheck, _propTypes.default.string);
  typeTests.number.typeCheck = withPropTypeCheck(typeTests.number.typeCheck, _propTypes.default.number);
  typeTests.boolean.typeCheck = withPropTypeCheck(typeTests.boolean.typeCheck, _propTypes.default.bool);
  typeTests.object.typeCheck = withPropTypeCheck(typeTests.object.typeCheck, _propTypes.default.object);
  typeTests.array.typeCheck = withPropTypeCheck(typeTests.array.typeCheck, _propTypes.default.array);
  return typeTests;
}

function propKeys(examples, Component = {}) {
  const {
    propTypes = {},
    defaultProps = {}
  } = Component;
  return new Set([].concat(Object.keys(propTypes ? propTypes : {}), Object.keys(defaultProps ? defaultProps : {}), ...examples.map(example => Object.keys(example))));
}

function extractKnobInfo(examples, Component = {}, options) {
  const {
    propTypes = {},
    defaultProps = {}
  } = Component;
  const keys = propKeys(examples, Component); // Wasteful copying of proptype and default prop data

  const typeInfo = Array.from(keys.values()).reduce((datum, key) => {
    datum[key] = (0, _types.extractTypeInfo)(examples.map(example => ({
      example: example[key],
      propType: propTypes[key],
      defaultProp: defaultProps[key]
    })), knobTypeTests(extractKnobInfo));
    return datum;
  }, {});
  return typeInfo;
}

function fromExamples(examples, Component, options = {}) {
  if (!Array.isArray(examples)) {
    examples = [examples];
  }

  const objectFields = extractKnobInfo(examples, Component, options);
  const typeInfo = {
    types: [{
      name: _types.DefaultTypeName.object,
      fields: objectFields
    }],
    nullCount: 0,
    undefinedCount: 0
  };
  return {
    knobified: example => {
      return knobified(example, typeInfo, options);
    }
  };
}

function knobified(example, typeInfo, options = {}) {
  const {
    types,
    nullCount,
    undefinedCount
  } = typeInfo;

  if (types.length <= 0) {
    return;
  }

  if (types.length > 1) {
    throw new Error(`Expecting root values to be object types. Root value types included [ ${types.map(type => type.name).join(', ')} ]`);
  }

  const type = types[0];

  if (type.name !== _types.DefaultTypeName.object) {
    throw new Error(`Expected ${_types.DefaultTypeName.object} but received ${type.name}`);
  }

  if (nullCount > 0 || undefinedCount > 0) {
    throw new Error('No null or undefined examples are allowed');
  }

  const rootType = type;
  return Object.keys(rootType.fields).reduce((knobified, fieldKey) => {
    knobified[fieldKey] = knobOfField(example[fieldKey], rootType.fields, fieldKey);
    return knobified;
  }, {});
}
//# sourceMappingURL=index.js.map
