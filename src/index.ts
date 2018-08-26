interface Options {
  recursive?: boolean;
  onMockedFunction?: (mockedFunction, originalValue) => any;
}

type Input<T, V> =
  | {
      [key: string]: T;
    }
  | Array<V>;

type InputObject<T> = { [P in keyof T]: T[P] };

type MockedObject<T> = { [P in keyof T]: any };

export function mockFunctions<T>(
  value: InputObject<T> | any,
  options: Options = {},
  ogToMockedMap: Map<any, any> = new Map(),
): MockedObject<T> | any {
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
