import { isLocationWithinBounds } from '../src/index';
import { ExpressionLocation } from '@fault/istanbul-util';
type StartLine = number;
type StartColumn = number;
type EndColumn = number;
type EndLine = number;

it('isLocationWithinBounds', () => {
  const testInputs: [
    boolean,
    [StartLine, StartColumn, EndLine, EndColumn],
    [StartLine, StartColumn, EndLine, EndColumn],
  ][] = [
    [true, [0, 0, 0, 0], [0, 0, 0, 0]],
    [true, [0, 0, 2, 2], [1, 1, 1, 1]],
    [true, [0, 0, 2, 2], [0, 0, 2, 2]],
    [true, [1, 1, 2, 2], [0, 0, 2, 2]],
    [true, [1, 1, 1, 1], [0, 0, 2, 2]],
    [true, [0, 0, 1, 1], [0, 0, 2, 2]],
    [false, [0, 0, 2, 2], [0, 0, 3, 2]],
    [false, [0, 0, 2, 2], [0, 0, 2, 3]],
  ];
  for (const [isWithinBounds, loc1, loc2] of testInputs) {
    const startLine1 = loc1[0];
    const startColumn1 = loc1[1];
    const endLine1 = loc1[2];
    const endColumn1 = loc1[3];

    const startLine2 = loc2[0];
    const startColumn2 = loc2[1];
    const endLine2 = loc2[2];
    const endColumn2 = loc2[3];

    const location1: ExpressionLocation = {
      start: {
        line: startLine1,
        column: startColumn1,
      },
      end: {
        line: endLine1,
        column: endColumn1,
      },
    };
    const location2: ExpressionLocation = {
      start: {
        line: startLine2,
        column: startColumn2,
      },
      end: {
        line: endLine2,
        column: endColumn2,
      },
    };
    it(`${startLine1}:${startColumn1}:${endLine1}:${endColumn1} vs ${startLine2}:${startColumn2}:${endLine2}:${endColumn2}`, () => {
      expect(isLocationWithinBounds(location1, location2)).to.equal(isWithinBounds);
      expect(isLocationWithinBounds(location2, location1)).to.equal(isWithinBounds);
    });
  }
});
