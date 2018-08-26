import { mockFunctions } from '../src/index';

const aObjectFunctionReturnValue = new Object();

let aObjectLiteral = undefined;
let anArrayFunctionReturnValue = undefined;
let anArray = undefined;

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
  expect(testInstance.value).toBe(4);
  const clonedInstance = mockFunctions(testInstance);
  expect(clonedInstance.value).toBe(4);
  clonedInstance.changeValue(10);
  expect(clonedInstance.value).toBe(10);
});

describe('only mocks functions', () => {
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

describe('invalid inputs', () => {
  [null, undefined].forEach(value => {
    it(`${value}`, () => {
      expect(() => mockFunctions(value)).toThrow(expect.any(Error));
    });
  });
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
    Object.keys(mockedArray).keys(key => {
      expect(mockedArray[key](1337)).toBe(arrayWithFunctions[key](1337));
    });
  });
});
