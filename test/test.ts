import { mockFunctions } from '../src/index';

const aObjectFunctionReturnValue = new Object();

let aObjectLiteral: any = undefined;
let anArrayFunctionReturnValue: any = undefined;
let anArray: any = undefined;

beforeEach(() => {
  anArrayFunctionReturnValue = new Object();
  aObjectLiteral = {
    int: 1,
    str: '',
    undefined: undefined,
    null: null,
    returnObject: () => aObjectFunctionReturnValue,
    someRegex: /regex/,
  };
  anArray = [
    function() {
      return anArrayFunctionReturnValue;
    },
    1,
    3,
    undefined,
    null,
    /regex/,
  ];
});
it('can mock prototypeless objects', () => {
  const prototypeless = Object.setPrototypeOf(
    new class {
      aFunction() {}
    }(),
    null,
  );
  expect(prototypeless.aFunction).toBeUndefined();
  const mocked = mockFunctions(prototypeless);
  expect(mocked.aFunction).toBeUndefined();
});
it('same class instances map to the same mocked class instances', () => {
  class TestClass {}
  const testClass1 = new TestClass();
  const testClass2 = new TestClass();
  const classes = [testClass1, testClass1, testClass2];
  const mockedClasses = mockFunctions(classes, { recursive: { classInstances: true } });
  for (let c = 0; c < classes.length; c++) {
    expect(classes[c]).not.toBe(mockedClasses[c]);
  }
  expect(mockedClasses[0]).toBe(mockedClasses[1]);
  expect(mockedClasses[0]).not.toBe(mockedClasses[2]);
});
it('same original function maps to the same mocked function', () => {
  const aFunction1 = () => {};
  const aFunction2 = () => {};
  const functions = [aFunction1, aFunction1, aFunction2];
  const mockedFunctions = mockFunctions(functions);
  for (let f = 0; f < functions.length; f++) {
    expect(functions[f]).not.toBe(mockedFunctions[f]);
  }
  expect(mockedFunctions[0]).toBe(mockedFunctions[1]);
  expect(mockedFunctions[0]).not.toBe(mockedFunctions[2]);
});

it('cloned instance behaves correctly', () => {
  const array = mockFunctions([2]);
  expect(array[0]).toBe(2);
  array.push(1);
  expect(array.shift()).toBe(2);
  expect(array.shift()).toBe(1);

  class TestClass {
    private _value: number;
    constructor() {
      this._value = 0;
    }

    changeValue(newValue) {
      this._value = newValue;
    }
    get value() {
      return this._value;
    }
  }

  const testInstance = new TestClass();
  testInstance.changeValue(4);
  const mockedInstance = mockFunctions(testInstance);
  expect(testInstance.value).toBe(4);
  expect(mockedInstance.value).toBeUndefined();
  mockedInstance.changeValue(10);
  expect(mockedInstance.value).toBeUndefined();
});

it('Multiple references to functions all map to same mocked function', () => {
  const aFunction = () => {};
  const anObject = {
    fn1: aFunction,
    fn2: aFunction,
  };
  const mockedObject = mockFunctions(anObject);
  expect(anObject.fn1).not.toBe(mockedObject.fn1);
  expect(mockedObject.fn1).toBe(mockedObject.fn2);
});

it('undefined', () => {
  expect(mockFunctions(undefined)).toBe(undefined);
});

it('null', () => {
  expect(mockFunctions(null)).toBe(null);
});

it('can mock class instances', () => {
  class AClass {
    public fn2;
    constructor() {
      this.fn2 = () => {
        return 3;
      };
    }
    fn1() {
      return 1;
    }
  }
  const instance = new AClass();
  const mockedInstance = mockFunctions(instance);
  expect(mockedInstance.fn1()).toBeUndefined();
  expect(mockedInstance.fn2()).toBeUndefined();
});

it('instance without constructor', () => {
  const instance = { aFunction: () => 11 };
  instance.constructor = undefined as any;
  const mockedInstance = mockFunctions(instance);
  expect(instance.aFunction()).toBe(11);
  expect(mockedInstance.aFunction()).not.toBe(instance.aFunction());
});

describe('classInstance behaves correctly', () => {
  class BClass {
    innerMethod() {
      return 42;
    }
  }
  class AClass {
    public inner;
    constructor() {
      this.inner = new BClass();
    }
    test() {
      return 100;
    }
  }
  it('mocks inner class when true', () => {
    const instance = new AClass();
    const mocked = mockFunctions(instance, { recursive: { classInstances: true } });
    expect(mocked.test()).toBeUndefined();
    expect(mocked.inner.innerMethod()).toBeUndefined();
  });
  it('mocks inner class when false', () => {
    const instance = new AClass();
    const mocked = mockFunctions(instance);
    expect(mocked.test()).toBeUndefined();
    expect(mocked.inner.innerMethod()).toBe(42);
  });
});

describe('only mocks functions', () => {
  it('with { method() {} }', () => {
    const aObject = {
      method() {
        return 1;
      },
    };
    const mockedObject = mockFunctions(aObject);
    expect(aObject.method()).toBe(1);
    expect(aObject.method()).not.toBe(mockedObject.method());
  });
  it('with modules', () => {
    const aModule = require('./es6-module');
    const mockedModule = mockFunctions(aModule);
    expect(mockedModule.someNumber).toBe(aModule.someNumber);
    expect(mockedModule.someFunction()).not.toBe(aModule.someFunction());
  });

  it('with object literal', () => {
    const mockedObject = mockFunctions(aObjectLiteral);
    expect(mockedObject.returnObject()).not.toBe(aObjectLiteral.returnObject());
    Object.getOwnPropertyNames(mockedObject)
      .filter(key => key !== 'returnObject')
      .forEach(key => {
        expect(mockedObject[key]).toBe(aObjectLiteral[key]);
      });
  });
  it('with array', () => {
    const mockedArray = mockFunctions(anArray);
    // Check that the function (1st element) isn't the same function
    const aFunction = mockedArray.shift();
    const originalFunction: Function = anArray[0] as Function;
    expect(aFunction()).not.toBe(originalFunction());
    mockedArray.forEach((notAFunction, i) => {
      expect(notAFunction).toBe(anArray[i + 1]);
    });
  });
});

describe('can mock recursively', () => {
  it('class with object', () => {
    class ClassWithObject {
      public anObject;
      constructor() {
        this.anObject = {
          aFunction: () => 10,
        };
      }
    }
    const classInstance = new ClassWithObject();
    const mockedInstance = mockFunctions(classInstance, {
      recursive: true,
    });
    expect(classInstance.anObject.aFunction()).toBe(10);
    expect(mockedInstance.anObject.aFunction()).toBeUndefined();
  });
  it('infinitely deep object', () => {
    const anObject = {};
    anObject['itself'] = anObject;
    mockFunctions(anObject, { recursive: true });
  });
  it('with Map object', () => {
    const aMap = new Map();
    aMap.set(1, 5);
    const mockedMap = mockFunctions(aMap, { recursive: true });
    expect(aMap.get(1)).toBe(5);
    expect(mockedMap.get(1)).toBe(5);
    expect(mockedMap.has(1)).toBe(true);
  });

  it('with Set object', () => {
    const aSet = new Set();
    const aFunction = () => {};
    aSet.add(1);
    aSet.add(aFunction);
    const mockedSet = mockFunctions(aSet);
    expect(aSet.has(1)).toBe(true);
    expect(aSet.has(aFunction)).toBe(true);
    expect(mockedSet.has(1)).toBe(true);
    expect(mockedSet.has(aFunction)).toBe(false);
  });

  it('with {...}', () => {
    const mockedObject = mockFunctions(
      {
        nested: aObjectLiteral,
      },
      { recursive: true },
    );
    expect(mockedObject.nested.returnObject()).not.toBe(aObjectLiteral.returnObject());
  });
  it('with array', () => {
    const mockedArray = mockFunctions([anArray], { recursive: true });
    const originalFunction = anArray[0] as Function;
    expect(mockedArray[0][0]()).not.toBe(originalFunction());
  });
});

it('only mocks recursively when recursive = true', () => {
  const mockedObject = mockFunctions({
    nested: aObjectLiteral,
  });
  expect(mockedObject.nested.returnObject()).toBe(aObjectLiteral.returnObject());
});

describe('can mock the function', () => {
  it('new Array(...)', () => {
    const originalValue = new Object();
    const originalArray = new Array(1).fill(() => () => originalValue);
    const mockedArray = mockFunctions(originalArray);
    expect(mockedArray[0]()).not.toBe(originalArray[0]());
  });
});

describe('onMockedFunction', () => {
  it('works with no parameters', () => {
    const objectWithFunctions = {
      0: () => -202,
      1: () => 10,
    };
    const mockedObject = mockFunctions(objectWithFunctions, {
      // Return the same exactly the same thing
      onMockedFunction: (fn, ogFn) => fn.mockImplementation(() => ogFn()),
    });
    Object.keys(objectWithFunctions).forEach(key => {
      expect(objectWithFunctions[key]()).toBe(mockedObject[key]());
    });
  });
  it('works with parameters', () => {
    const arrayWithFunctions = [val => val];
    const mockedArray = mockFunctions(arrayWithFunctions, {
      onMockedFunction: (fn, ogFn) => fn.mockImplementation((...other) => ogFn(...other)),
    });
    Object.keys(mockedArray).forEach(key => {
      expect(mockedArray[key](1337)).toBe(arrayWithFunctions[key](1337));
    });
  });
});
