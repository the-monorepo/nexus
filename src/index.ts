interface Options {
  recursive?: boolean;
}
type Input =
  | {
      [key: string]: any;
    }
  | Array<any>;

export function mockFunctions(value: Input, options: Options = {}) {
  const mockedObject = value.constructor();
  Object.keys(value).forEach(key => {
    const realValue = value[key];
    if (typeof realValue === 'function') {
      mockedObject[key] = jest.fn();
    } else if (typeof realValue === 'object') {
      if (realValue !== null && options.recursive) {
        mockedObject[key] = mockFunctions(realValue, options);
      } else {
        mockedObject[key] = realValue;
      }
    } else {
      mockedObject[key] = realValue;
    }
  });
  return mockedObject;
}
