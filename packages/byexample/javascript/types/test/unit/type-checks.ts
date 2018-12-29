import {
  isBoolean,
  isObject,
  isArray,
  isString,
  isFunction,
  isNumber,
} from '../../src/type-checks.ts';
import { typeValues } from '../inputs/typeValues.ts';
function testTypeCheckWithtypes(name, validValues, typeCheck) {
  describe(name, () => {
    validValues.forEach((key) =>
      describe(`${key} (valid)`, () => {
        typeValues[key].forEach((value) => {
          it(`${value}`, () => {
            expect(typeCheck(value)).toBe(true);
          });
        });
      }),
    );
    Object.keys(typeValues)
      .filter((key) => !validValues.includes(key))
      .forEach((key) => {
        describe(key, () => {
          typeValues[key].forEach((value) => {
            it(`${value}`, () => {
              expect(typeCheck(value)).toBe(false);
            });
          });
        });
      });
  });
}
/**
 * Checking to see if each individual type check is working as expected
 */
describe('type checks', () => {
  testTypeCheckWithtypes('isBoolean', ['boolean'], isBoolean);
  testTypeCheckWithtypes('isObject', ['object'], isObject);
  testTypeCheckWithtypes('isArray', ['array'], isArray);
  testTypeCheckWithtypes('isString', ['string'], isString);
  testTypeCheckWithtypes('isFunction', ['function', 'class'], isFunction);
  testTypeCheckWithtypes('isNumber', ['number'], isNumber);
});
