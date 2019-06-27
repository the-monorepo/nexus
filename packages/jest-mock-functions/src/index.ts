export interface RecursionOptions {
  classInstances?: boolean;
}

export interface Options {
  recursive?: boolean | RecursionOptions;
  // Mock the methods of class instances too?
  onMockedFunction?: (mockedFunction, originalValue) => any;
}

export type MockedFunctions<T> = {
  [P in keyof T]: P extends Function ? jest.Mock<T[P]> : T[P]
};

function constructBasedOff(obj) {
  if (obj.constructor) {
    return new obj.constructor();
  } else {
    // We can fallback to just cloning the prototype across if there's no constructor
    return objectWithPrototypeFrom(obj);
  }
}

function objectWithPrototypeFrom(obj) {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

function mockValue(realValue, options: Options, ogToMockedMap: Map<any, any>) {
  const { recursive } = options;
  const classInstances: boolean | undefined = recursive
    ? (recursive as RecursionOptions).classInstances
    : false;
  if (ogToMockedMap.has(realValue)) {
    return ogToMockedMap.get(realValue);
  }
  function handleContainer(createMockStubCallback, mockCallback) {
    // .size == 0 to see if we haven't done any recursion yet
    if (options.recursive || ogToMockedMap.size == 0) {
      const mocked = createMockStubCallback(realValue);
      ogToMockedMap.set(realValue, mocked);
      return mockCallback(realValue, mocked, options, ogToMockedMap);
    } else {
      return realValue;
    }
  }

  if (typeof realValue === 'function') {
    if (ogToMockedMap.has(realValue)) {
    }
    const mockedFn = jest.fn();
    ogToMockedMap.set(realValue, mockedFn);
    if (options.onMockedFunction) {
      options.onMockedFunction(mockedFn, realValue);
    }
    return mockedFn;
  } else if (realValue === null || realValue === undefined) {
    return realValue;
  } else if (realValue instanceof Map) {
    return handleContainer(constructBasedOff, mockMapValues);
  } else if (realValue instanceof Set) {
    return handleContainer(constructBasedOff, mockSetValues);
  } else if (
    Array.isArray(realValue) ||
    Object.getPrototypeOf({}) === Object.getPrototypeOf(realValue) ||
    Object.getPrototypeOf(exports) === Object.getPrototypeOf(realValue)
  ) {
    // Mock fields in {...}
    return handleContainer(constructBasedOff, mockProperties);
  } else if (
    typeof realValue === 'object' &&
    (classInstances || ogToMockedMap.size == 0)
  ) {
    return handleContainer(objectWithPrototypeFrom, (realVal, mocked, opts, map) => {
      const mocked2 = mockPrototypeFunctions(realVal, mocked, opts, map);
      return mockProperties(realVal, mocked2, opts, map);
    });
  } else {
    return realValue;
  }
}

function mockPrototypeFunctions<T, V>(
  value: T,
  mockedObject: V,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): MockedFunctions<T> & V | V {
  // This will map the prototype values to the mocked object and not other objects with the same prototype
  const prototype = Object.getPrototypeOf(value);
  if (prototype) {
    return mockProperties(prototype, mockedObject, options, ogToMockedMap);
  } else {
    return mockedObject;
  }
}

function mockProperties<T, V>(
  value: T,
  mockedObject: V,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): MockedFunctions<T> & V {
  const propertyDescriptors = Object.getOwnPropertyDescriptors(value);
  Object.keys(propertyDescriptors).forEach(key => {
    const propertyDescriptor = propertyDescriptors[key];
    const mockedPropertyDescriptor =
      propertyDescriptor.get || propertyDescriptor.set
        ? {
            ...propertyDescriptor,
            get: mockValue(propertyDescriptor.get, options, ogToMockedMap),
            set: mockValue(propertyDescriptor.set, options, ogToMockedMap),
          }
        : {
            ...propertyDescriptor,
            value: mockValue(propertyDescriptor.value, options, ogToMockedMap),
          };
    Object.defineProperty(mockedObject, key, mockedPropertyDescriptor);
  });
  return mockedObject as MockedFunctions<T> & V;
}

function mockMapValues<T, V>(
  actualMap: Map<T, V>,
  mockedMap,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): Map<T, V | MockedFunctions<V>> {
  for (const [key, value] of actualMap.entries()) {
    mockedMap.set(key, mockValue(value, options, ogToMockedMap));
  }
  return mockedMap;
}

function mockSetValues<T>(
  actualSet: Set<T>,
  mockedSet,
  options: Options = {},
  ogToMockedMap: Map<any, any>,
): Set<T | MockedFunctions<T>> {
  for (const value of actualSet) {
    mockedSet.add(mockValue(value, options, ogToMockedMap));
  }
  return mockedSet;
}

export function mockFunctions<T>(
  value: T,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): MockedFunctions<T> {
  return mockValue(value, options, ogToMockedMap);
}

export default mockFunctions;
