import {
  isBoolean,
  isObject,
  isArray,
  isString,
  isFunction,
  isNumber,
} from '../src/type-checks';
const typeValues = {
  boolean: [true, false],
  string: ['true', 'false', ''],
  object: [
    {},
    {
      test: 'test',
    },
  ],
  array: [[], ['test'], [{}]],
  number: [1, -1, 0, 2.32],
  function: [() => {}, function() {}, function namedFunction() {}],
  class: [class {}, class NamedClass {}],
};
function testTypeCheck(name, validValues, typeCheck) {
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
  testTypeCheck('isBoolean', ['boolean'], isBoolean);
  testTypeCheck('isObject', ['object'], isObject);
  testTypeCheck('isArray', ['array'], isArray);
  testTypeCheck('isString', ['string'], isString);
  testTypeCheck('isFunction', ['function', 'class'], isFunction);
  testTypeCheck('isNumber', ['number'], isNumber);
});
