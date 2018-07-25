'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.knobifyField = knobifyField;
exports.knobify = knobify;

var _addonKnobs = require('@storybook/addon-knobs');

var _types = require('@by-example/types');

var _cssColorChecker = require('css-color-checker');

// TODO: Should probably mock @storybook/addon-knobs
function knobifyField(example, fieldTypeInfos, key) {
  const value = example[key];
  const typeInfo = fieldTypeInfos[key];
  let knob = undefined;

  if (typeInfo.types.length === 1) {
    switch (typeInfo.types[0].type) {
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

  example[key] = knob;
}

function knobify(examples, typeInfo) {
  const { types, nullCount, undefinedCount } = typeInfo;

  if (types.length <= 0) {
    return;
  } else if (types.length > 1 || types[0].type !== _types.DefaultTypeName.object) {
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
