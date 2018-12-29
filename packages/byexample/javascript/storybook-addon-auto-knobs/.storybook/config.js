import { addDecorator, configure } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { createStories } from './createStories.ts'
import { withAutoKnobs } from '../src/index.ts'

addDecorator(withKnobs);
addDecorator(withAutoKnobs);

configure(createStories, module);
