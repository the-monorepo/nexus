interface Options {
  recursive?: boolean;
  onMockedFunction?: (mockedFunction, originalValue) => any;
}

type MockedObject<T> = { [P in keyof T]: any };

function mockValue<T>(
  value: T,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): MockedObject<T> {
  const { onMockedFunction = () => {} } = options;
  const mockedObject = Object.assign(Object.create(Object.getPrototypeOf(value)), value);
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
  return mockedObject;
}

export function mockFunctions<T>(
  value: T,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): MockedObject<T> {
  return ogToMockedMap.has(value)
    ? ogToMockedMap.get(value)
    : mockValue(value, options, ogToMockedMap);
}
