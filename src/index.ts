interface Options {
  recursive?: boolean;
  onMockedFunction?: (mockedFunction, originalValue) => any
}

type Input =
  | {
      [key: string]: any;
    }
  | Array<any>;

export function mockFunctions(
  value: Input, 
  options: Options = {  }
) {
  const { onMockedFunction = () => {} } = options;
  const mockedObject = value.constructor();
  Object.keys(value).forEach(key => {
    const realValue = value[key];
    if (typeof realValue === 'function') {
      mockedObject[key] = jest.fn();
      onMockedFunction(mockedObject[key], realValue);
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
