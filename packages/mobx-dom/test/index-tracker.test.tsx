import { segmentTracker } from '../src/index-tracker';
it('index-tracker', () => {
  const tracker = segmentTracker();
  // <staticnode/>
  const segment1 = tracker.addSegment(1);
  expect(segment1.length).toBe(0);
  expect(segment1.start).toBe(1);

  // <staticnode/><staticnode/><staticnode/>
  const segment2 = tracker.addSegment(2);
  expect(segment1.start).toBe(1);
  expect(segment1.length).toBe(0);
  expect(segment2.start).toBe(3);

  // <staticnode/><segment1child/><staticnode/><staticnode/>
  segment1.length = 1;
  expect(segment1.length).toBe(1);
  expect(segment1.start).toBe(1);
  expect(segment2.start).toBe(4);
});
