import { expandInputs } from '../inputs/expand';
import { TestInputs } from '../inputs/test-inputs';
export const invalidTypes: [string, any][] = [
  ['Function', () => undefined],
  ['Integer', 1],
  ['Floating point', 0.1],
  ['Class object', new class {}()],
  ['Object', {}],
  ['Array', []],
  ['null', null],
  ['undefined', undefined],
  ['true', true],
  ['false', false],
];

export function testColorTypeFunction(
  testSuiteDescription: string,
  colorTypeFunction,
  ...testInputMappings: [string, TestInputs, any][]
) {
  describe(testSuiteDescription, () => {
    describe('Invalid', () => {
      invalidTypes.forEach(([testName, value]) => {
        it(testName, () => {
          try {
            expect(colorTypeFunction(value)).toBe(undefined);
          } catch (err) {}
        });
        it('undefined', () => {
          try {
            expect(colorTypeFunction(value)).toBe(undefined);
          } catch (err) {}
        });
        it('no parameters', () => {
          try {
            expect(colorTypeFunction(value)).toBe(undefined);
          } catch (err) {}
        });
      });
    });
    for (const [description, inputs, expectedValue] of testInputMappings) {
      describe(description, () => {
        describe('Valid', () => {
          for (const value of inputs.valid) {
            it(value, () => {
              expect(colorTypeFunction(value)).toBe(expectedValue);
            });
          }
        });
        describe('Invalid', () => {
          for (const value of inputs.invalid) {
            it(value, () => {
              expect(colorTypeFunction(value)).not.toBe(expectedValue);
            });
          }
        });
      });
    }
  });
}

export function testFunction(
  description: string,
  isColorFunction,
  ...validTestInputs: TestInputs[]
) {
  describe(description, () => {
    const testInputs = expandInputs(...validTestInputs);
    describe('Invalid', () => {
      invalidTypes.forEach(([testName, value]) => {
        it(testName, () => {
          expect(isColorFunction(value)).toBe(false);
        });
      });
      it('no parameters', () => {
        expect(isColorFunction()).toBe(false);
      });
      for (const testInput of testInputs.invalid) {
        it(`${testInput}`, () => {
          expect(isColorFunction(testInput)).toBe(false);
        });
      }
    });
    describe('Valid', () => {
      for (const testInput of testInputs.valid) {
        it(`${testInput}`, () => {
          expect(isColorFunction(testInput)).toBe(true);
        });
      }
    });
  });
}
