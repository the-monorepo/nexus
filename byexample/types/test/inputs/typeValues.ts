export const typeValues = {
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
  function: [() => {}, function () {}, function namedFunction() {}],
  class: [class {}, class NamedClass {}],
  null: [null],
  undefined: [undefined],
};
