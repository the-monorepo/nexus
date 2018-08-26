export interface Options {
  recursive?: boolean;
  onMockedFunction?: (mockedFunction, originalValue) => any;
}

export type Mocked<T> = { [P in keyof T]: any };

function mockValue(realValue, options: Options, ogToMockedMap: Map<any, any>) {
  const { onMockedFunction = () => {} } = options;
  if (typeof realValue === 'function') {
    const mockedFn = jest.fn();
    onMockedFunction(mockedFn, realValue);
    return mockedFn;
  } else if (typeof realValue === 'object') {
    if (realValue !== null && options.recursive) {
      return mockFunctions(realValue, options, ogToMockedMap);
    } else {
      return realValue;
    }
  } else {
    return realValue;
  }
}

function mockProperties<T>(
  value: T,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): Mocked<T> {
  const mockedObject = Object.assign(Object.create(Object.getPrototypeOf(value)), value);
  ogToMockedMap.set(value, mockedObject);
  const propertyDescriptors = Object.getOwnPropertyDescriptors(value);
  Object.keys(propertyDescriptors).forEach(key => {
    const propertyDescriptor = propertyDescriptors[key];
    const mockedValue = mockValue(propertyDescriptor.value, options, ogToMockedMap);
    const mockedPropertyDescriptor = { ...propertyDescriptor, value: mockedValue };
    Object.defineProperty(mockedObject, key, mockedPropertyDescriptor);
  });
  return mockedObject;
}

export function mockFunctions<T>(
  value: T,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): Mocked<T> {
  return ogToMockedMap.has(value)
    ? ogToMockedMap.get(value)
    : mockProperties(value, options, ogToMockedMap);
}
