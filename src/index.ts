import { create } from 'domain';

export interface Options {
  recursive?: boolean;
  onMockedFunction?: (mockedFunction, originalValue) => any;
}

export type Mocked<T> = { [P in keyof T]: any };

function constructBasedOff(obj) {
  return new obj.constructor();
}

function mockValue(realValue, options: Options, ogToMockedMap: Map<any, any>) {
  function handleContainer(createMockStubCallback, mockCallback) {
    if (ogToMockedMap.has(realValue)) {
      return ogToMockedMap.get(realValue);
    } else if (options.recursive || ogToMockedMap.size == 0) {
      const mocked = createMockStubCallback(realValue);
      ogToMockedMap.set(realValue, mocked);
      return mockCallback(realValue, mocked, options, ogToMockedMap);
    } else {
      return realValue;
    }
  }
  const { onMockedFunction = () => {} } = options;
  if (typeof realValue === 'function') {
    const mockedFn = jest.fn();
    onMockedFunction(mockedFn, realValue);
    return mockedFn;
  } else if (realValue === null || realValue === undefined) {
    return realValue;
  } else if (realValue instanceof Map) {
    return handleContainer(constructBasedOff, mockMapValues);
  } else if (realValue instanceof Set) {
    return handleContainer(constructBasedOff, mockSetValues);
  }
  if (typeof realValue === 'object') {
    return handleContainer(constructBasedOff, mockProperties);
  } else {
    return realValue;
  }
}

function mockProperties<T>(
  value: T,
  mockedObject,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): Mocked<T> {
  const propertyDescriptors = Object.getOwnPropertyDescriptors(value);

  Object.keys(propertyDescriptors).forEach(key => {
    const propertyDescriptor = propertyDescriptors[key];
    const mockedValue = mockValue(propertyDescriptor.value, options, ogToMockedMap);
    const mockedPropertyDescriptor = { ...propertyDescriptor, value: mockedValue };
    Object.defineProperty(mockedObject, key, mockedPropertyDescriptor);
  });
  return mockedObject;
}

function mockMapValues<T, V>(
  actualMap: Map<T, V>,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): Map<T, V | Mocked<V>> {
  const mockedMap = new Map();
  for (const [key, value] of actualMap.entries()) {
    mockedMap.set(key, mockValue(value, options, ogToMockedMap));
  }
  return mockedMap;
}

function mockSetValues<T>(
  actualSet: Set<T>,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): Set<T | Mocked<T>> {
  const mockedSet = new Set();
  for (const value of actualSet) {
    mockedSet.add(mockValue(value, options, ogToMockedMap));
  }
  return mockedSet;
}

export function mockFunctions<T>(
  value: T,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): Mocked<T> {
  return mockValue(value, options, ogToMockedMap);
}
