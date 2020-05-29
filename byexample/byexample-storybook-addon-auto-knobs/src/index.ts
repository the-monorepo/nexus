import { makeDecorator } from '@storybook/addons';

import { fromExamples } from '@byexample/storybook-knobified';
export const withAutoKnobs = makeDecorator({
  name: 'withAutoKnobs',
  wrapper: (getStory, context) => {
    const story = getStory(context);
    const knobbedStory = {
      ...story,
      props: fromExamples(story.props, context.type, {}).knobified(story.props),
    };
    return knobbedStory;
  },
});
