import { TestComponent } from './TestComponent';
import { storiesOf } from '@storybook/react';

import { extractTypeInfo } from '@by-example/types';
import { knobify } from '../lib/index';
import React from 'react';
import { boolean, number } from '@storybook/addon-knobs';
export function createStories() {
  const stories1 = storiesOf('All types in object', module);
  const propsList = [
    {
      boolean: true,
      number: 1,
      array: [],
      object: {},
      fn: () => {},
      string: '#FFF',
    },
    {
      string: 'e',
      color: '#FFF',
    },
  ];
  const typeInfo = extractTypeInfo(propsList);
  propsList.forEach((props, index) => {
    stories1.add(`Story ${index + 1}`, () => (
      <TestComponent {...knobify(props, typeInfo, TestComponent.propTypes)} />
    ));
  });
}
