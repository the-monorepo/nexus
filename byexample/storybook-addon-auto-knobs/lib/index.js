"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withAutoKnobs = void 0;

var _addons = require("@storybook/addons");

var _storybookKnobified = require("@byexample/storybook-knobified");

const withAutoKnobs = (0, _addons.makeDecorator)({
  name: 'withAutoKnobs',
  wrapper: (getStory, context) => {
    const story = getStory(context);
    const knobbedStory = { ...story,
      props: (0, _storybookKnobified.fromExamples)(story.props, context.type, {}).knobified(story.props)
    };
    return knobbedStory;
  }
});
exports.withAutoKnobs = withAutoKnobs;
//# sourceMappingURL=index.js.map
