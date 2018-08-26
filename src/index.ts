interface Options {
  recursive?: boolean;
  onMockedFunction?: (mockedFunction, originalValue) => any;
}

type Input =
  | {
      [key: string]: any;
    }
  | Array<any>;

export function mockFunctions(
  value: Input,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
) {
  const { onMockedFunction = () => {} } = options;
  let mockedObject = undefined;
  if (ogToMockedMap.has(value)) {
    mockedObject = ogToMockedMap.get(value);
  } else {
    mockedObject = Object.assign(Object.create(Object.getPrototypeOf(value)), value);
    ogToMockedMap.set(value, mockedObject);
    Object.getOwnPropertyNames(value).forEach(key => {
      const realValue = value[key];
      if (typeof realValue === 'function') {
        mockedObject[key] = jest.fn();
        onMockedFunction(mockedObject[key], realValue);
      } else if (typeof realValue === 'object') {
        if (realValue !== null && options.recursive) {
          mockedObject[key] = mockFunctions(realValue, options, ogToMockedMap);
        } else {
          mockedObject[key] = realValue;
        }
      } else {
        mockedObject[key] = realValue;
      }
    });
  }
  return mockedObject;
}
