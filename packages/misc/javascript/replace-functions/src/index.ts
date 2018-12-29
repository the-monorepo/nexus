export type RecursionOptionsObject = {
  // Mock the methods of class instances too?
  classInstances?: boolean;
};

export type RecursionOptions = RecursionOptionsObject | boolean;

export type CreateReplacementValueFn<T> = (originalValue: (...args: any[]) => any) => T;

export type Replaced<T, R> = {
  [P in keyof T]: P extends (...args: any[]) => any ? R : T[P];
};

function objectWithPrototypeFrom(obj) {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

function constructBasedOff(obj) {
  if (obj.constructor) {
    return new obj.constructor();
  } else {
    // We can fallback to just cloning the prototype across if there's no constructor
    return objectWithPrototypeFrom(obj);
  }
}

function mockSetValues<T, R>(
  actualSet: Set<T>,
  mockedSet,
  createReplacementValue: CreateReplacementValueFn<R>,
  recursive: RecursionOptions,
  mockValueFn: MockValueFn,
  ogToMockedMap: Map<any, any>,
): Set<T | Replaced<T, R>> {
  for (const value of actualSet) {
    mockedSet.add(
      mockValueFn(value, createReplacementValue, recursive, mockValueFn, ogToMockedMap),
    );
  }
  return mockedSet;
}

function mockMapValues<T, V, R>(
  actualMap: Map<T, V>,
  mockedMap,
  createReplacementValue: CreateReplacementValueFn<R>,
  recursive: RecursionOptions,
  mockValueFn: MockValueFn,
  ogToMockedMap: Map<any, any> = new Map(),
): Map<T, V | Replaced<V, R>> {
  for (const [key, value] of actualMap.entries()) {
    mockedMap.set(
      key,
      mockValueFn(value, createReplacementValue, recursive, mockValueFn, ogToMockedMap),
    );
  }
  return mockedMap;
}

function mockProperties<T, V, R>(
  value: T,
  mockedObject: V,
  createReplacementValue: CreateReplacementValueFn<R>,
  recursive: RecursionOptions,
  mockValueFn: MockValueFn,
  ogToMockedMap: Map<any, any> = new Map(),
): Replaced<T, R> & V {
  const propertyDescriptors = Object.getOwnPropertyDescriptors(value);
  Object.keys(propertyDescriptors).forEach((key) => {
    const propertyDescriptor = propertyDescriptors[key];
    const mockedPropertyDescriptor =
      propertyDescriptor.get || propertyDescriptor.set
        ? {
            ...propertyDescriptor,
            get: mockValueFn(
              propertyDescriptor.get,
              createReplacementValue,
              recursive,
              mockValueFn,
              ogToMockedMap,
            ),
            set: mockValueFn(
              propertyDescriptor.set,
              createReplacementValue,
              recursive,
              mockValueFn,
              ogToMockedMap,
            ),
          }
        : {
            ...propertyDescriptor,
            value: mockValueFn(
              propertyDescriptor.value,
              createReplacementValue,
              recursive,
              mockValueFn,
              ogToMockedMap,
            ),
          };
    Object.defineProperty(mockedObject, key, mockedPropertyDescriptor);
  });
  return mockedObject as Replaced<T, R> & V;
}

function mockPrototypeFunctions<T, V, R>(
  value: T,
  mockedObject: V,
  createReplacementValue: CreateReplacementValueFn<R>,
  recursive: RecursionOptions,
  mockValueFn: MockValueFn,
  ogToMockedMap: Map<any, any> = new Map(),
): (Replaced<T, R> & V) | V {
  // This will map the prototype values to the mocked object and not other objects with the same prototype
  const prototype = Object.getPrototypeOf(value);
  if (prototype) {
    return mockProperties(
      prototype,
      mockedObject,
      createReplacementValue,
      recursive,
      mockValueFn,
      ogToMockedMap,
    );
  } else {
    return mockedObject;
  }
}

function mockValue<R>(
  realValue,
  createReplacementValue: CreateReplacementValueFn<R>,
  recursive: RecursionOptions,
  mockValueFn: MockValueFn,
  ogToMockedMap: Map<any, any>,
) {
  const classInstances: boolean | undefined =
    (recursive as RecursionOptionsObject).classInstances === true;
  if (ogToMockedMap.has(realValue)) {
    return ogToMockedMap.get(realValue);
  }
  function handleContainer(createMockStubCallback, mockCallback) {
    // .size == 0 to see if we haven't done any recursion yet
    if (recursive || ogToMockedMap.size === 0) {
      const mocked = createMockStubCallback(realValue);
      ogToMockedMap.set(realValue, mocked);
      return mockCallback(
        realValue,
        mocked,
        createReplacementValue,
        recursive,
        mockValueFn,
        ogToMockedMap,
      );
    } else {
      return realValue;
    }
  }

  if (typeof realValue === 'function') {
    const mockedFn = createReplacementValue(realValue);
    ogToMockedMap.set(realValue, mockedFn);
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
    return handleContainer(
      objectWithPrototypeFrom,
      (realVal, mocked, createReplacementValueFn, opts, mockValueFn, map) => {
        const mocked2 = mockPrototypeFunctions(
          realVal,
          mocked,
          createReplacementValue,
          opts,
          mockValueFn,
          map,
        );
        return mockProperties(
          realVal,
          mocked2,
          createReplacementValue,
          opts,
          mockValue,
          map,
        );
      },
    );
  } else {
    return realValue;
  }
}
export type MockValueFn = typeof mockValue;

export function replaceFunctions<T, R>(
  value: T,
  createReplacementValue: CreateReplacementValueFn<R>,
  recursive: RecursionOptions = false,
): Replaced<T, R> {
  return mockValue(value, createReplacementValue, recursive, mockValue, new Map());
}

export default replaceFunctions;
