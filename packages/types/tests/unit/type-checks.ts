import {
  isBoolean,
  isObject,
  isArray,
  isString,
  isFunction,
  isNumber,
} from '../../src/type-checks';
import { typeValues } from '../inputs/typeValues';
function testTypeCheckWithTypeValues(name, validValues, typeCheck) {
  describe(name, () => {
    validValues.forEach(key =>
      describe(`${key} (valid)`, () => {
        typeValues[key].forEach(value => {
          it(`${value}`, () => {
            expect(typeCheck(value)).toBe(true);
          });
        });
      }),
    );
    Object.keys(typeValues)
      .filter(key => !validValues.includes(key))
      .forEach(key => {
        describe(key, () => {
          typeValues[key].forEach(value => {
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
  testTypeCheckWithTypeValues('isBoolean', ['boolean'], isBoolean);
  testTypeCheckWithTypeValues('isObject', ['object'], isObject);
  testTypeCheckWithTypeValues('isArray', ['array'], isArray);
  testTypeCheckWithTypeValues('isString', ['string'], isString);
  testTypeCheckWithTypeValues('isFunction', ['function', 'class'], isFunction);
  testTypeCheckWithTypeValues('isNumber', ['number'], isNumber);
});
