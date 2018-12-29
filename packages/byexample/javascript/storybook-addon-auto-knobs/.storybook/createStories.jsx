import { TestComponent } from './TestComponent.ts'
import { storiesOf } from '@storybook/react';
import React from 'react';
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
  propsList.forEach((props, index) => {
    stories1.add(`Story ${index + 1}`, () => <TestComponent {...props} />);
  });
}
