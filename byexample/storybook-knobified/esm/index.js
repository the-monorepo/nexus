"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// TODO: Should probably mock @storybook/addon-knobs
import { text, boolean, number, object, array, color } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { DefaultTypeName, extractTypeInfo, defaultTypeTests } from '@byexample/types';
import { isCssColor } from 'css-color-checker';
import PropTypes from 'prop-types';

function propTypeMatches(testedPropType, expectedPropType) {
  if (testedPropType === expectedPropType) {
    return true;
  } else if (expectedPropType.isRequired && expectedPropType.isRequired === testedPropType) {
    return true;
  } else {
    return false;
  }
}

export var isCssColorSymb = Symbol('isCssColor');

function knobBasedOffExamples(value, typeInfo, key) {
  if (typeInfo.types.length === 1) {
    var type = typeInfo.types[0];

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

function knobOfField(value, fields, key) {
  return knobBasedOffExamples(value, fields[key], key);
}

function shimDefaultTypeTests(typeTests) {
  return Object.keys(typeTests).reduce((newTypeTests, key) => {
    newTypeTests[key] = {
      typeCheck: (_ref) => {
        var {
          example
        } = _ref;
        return typeTests[key].typeCheck(example);
      },
      value: propData => {
        var examples = propData.map((_ref2) => {
          var {
            example
          } = _ref2;
          return example;
        });
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
    var {
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
  var defaultTests = defaultTypeTests(extractTypeInfoFn);
  var ogValueFn = defaultTests.string.value;

  defaultTests.string.value = examples => {
    var ogValue = ogValueFn(examples);
    var isColor = true;

    for (var example of examples) {
      if (example !== undefined && example !== null && !isCssColor(example)) {
        isColor = false;
        break;
      }
    }

    return _objectSpread(_objectSpread({}, ogValue), {}, {
      [isCssColorSymb]: isColor
    });
  };

  var typeTests = shimDefaultTypeTests(defaultTests);
  typeTests.string.typeCheck = withPropTypeCheck(typeTests.string.typeCheck, PropTypes.string);
  typeTests.number.typeCheck = withPropTypeCheck(typeTests.number.typeCheck, PropTypes.number);
  typeTests.boolean.typeCheck = withPropTypeCheck(typeTests.boolean.typeCheck, PropTypes.bool);
  typeTests.object.typeCheck = withPropTypeCheck(typeTests.object.typeCheck, PropTypes.object);
  typeTests.array.typeCheck = withPropTypeCheck(typeTests.array.typeCheck, PropTypes.array);
  return typeTests;
}

function propKeys(examples) {
  var Component = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var {
    propTypes = {},
    defaultProps = {}
  } = Component;
  return new Set([].concat(Object.keys(propTypes ? propTypes : {}), Object.keys(defaultProps ? defaultProps : {}), ...examples.map(example => Object.keys(example))));
}

function extractKnobInfo(examples) {
  var Component = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var options = arguments.length > 2 ? arguments[2] : undefined;
  var {
    propTypes = {},
    defaultProps = {}
  } = Component;
  var keys = propKeys(examples, Component); // Wasteful copying of proptype and default prop data

  var typeInfo = Array.from(keys.values()).reduce((datum, key) => {
    datum[key] = extractTypeInfo(examples.map(example => ({
      example: example[key],
      propType: propTypes[key],
      defaultProp: defaultProps[key]
    })), knobTypeTests(extractKnobInfo));
    return datum;
  }, {});
  return typeInfo;
}

export function fromExamples(examples, Component) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!Array.isArray(examples)) {
    examples = [examples];
  }

  var objectFields = extractKnobInfo(examples, Component, options);
  var typeInfo = {
    types: [{
      name: DefaultTypeName.object,
      fields: objectFields
    }],
    nullCount: 0,
    undefinedCount: 0
  };
  return {
    knobified: example => {
      return _knobified(example, typeInfo, options);
    }
  };
}

function _knobified(example, typeInfo) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var {
    types,
    nullCount,
    undefinedCount
  } = typeInfo;

  if (types.length <= 0) {
    return;
  }

  if (types.length > 1) {
    throw new Error("Expecting root values to be object types. Root value types included [ ".concat(types.map(type => type.name).join(', '), " ]"));
  }

  var type = types[0];

  if (type.name !== DefaultTypeName.object) {
    throw new Error("Expected ".concat(DefaultTypeName.object, " but received ").concat(type.name));
  }

  if (nullCount > 0 || undefinedCount > 0) {
    throw new Error('No null or undefined examples are allowed');
  }

  var rootType = type;
  return Object.keys(rootType.fields).reduce((knobified, fieldKey) => {
    knobified[fieldKey] = knobOfField(example[fieldKey], rootType.fields, fieldKey);
    return knobified;
  }, {});
}

export { _knobified as knobified };
//# sourceMappingURL=index.js.map
