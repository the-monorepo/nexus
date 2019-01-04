import { makeDecorator } from '@storybook/addons';
import { fromExamples } from '@byexample/storybook-knobified';
export const withAutoKnobs = makeDecorator({
  name: 'withAutoKnobs',
  wrapper: (getStory, context) => {
    /*const bucket = getStorybook().filter((bucket) => bucket.kind === context.kind)[0];
    const storiesProps = bucket.stories.filter(story => story.name !== context.story).map(story => {
      return getStory()
    });*/
    const story = getStory(context);
    const knobbedStory = {
      ...story,
      props: fromExamples([story.props], context.type, {}).knobified(story.props),
    };
    return knobbedStory;
  },
});
