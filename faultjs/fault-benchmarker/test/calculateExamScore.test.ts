import { ScorelessFault } from '@fault/addon-sbfl';
import { calculateExamScore } from '../src/index';
describe('measure', () => {
  describe('exact match', () => {
    it('1 fault, 1 line', () => {
      const faults: ScorelessFault[] = [
        {
          sourcePath: 'a',
          location: {
            start: {
              line: 1,
              column: 1,
            },
            end: {
              line: 1,
              column: 1,
            },
          },
        },
        {
          sourcePath: 'a',
          location: {
            start: {
              line: 2,
              column: 2,
            },
            end: {
              line: 1,
              column: 1,
            },
          },
        },
      ];
      expect(calculateExamScore('', faults, faults, 2)).toEqual({
        exam: 0,
        rankings: [0, 0],
      });
    });
  });
});
