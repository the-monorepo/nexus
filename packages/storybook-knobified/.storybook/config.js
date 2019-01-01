import { addDecorator, configure } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { createStories } from './createStories';
import { withAutoKnobs } from '../src';

addDecorator(withKnobs);
addDecorator(withAutoKnobs);

configure(createStories, module);
