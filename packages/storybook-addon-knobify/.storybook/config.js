import { addDecorator, configure } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { createStories } from './createStories';

addDecorator(withKnobs);

configure(createStories, module);
