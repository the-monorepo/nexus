import { TestComponent } from './TestComponent';

export function createStories() {
  const stories1 = storiesOf('All types in object', module);
  stories1.add('Story 1', () => (
    <TestComponent boolean={true} number={1} array={[]} object={{ test: 1 }} />
  ));

  stories1.add('Story 2', () => <TestComponent string="test" color="#FFFFFF" />);
}
