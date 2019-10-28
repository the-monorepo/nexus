import { stubFunctions } from '../src/index';

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
describe('empty containers', () => {
  it('set', () => {
    expect(stubFunctions(new Set()).size).to.equal(0);
  });
  it('map', () => {
    expect(stubFunctions(new Map()).size).to.equal(0);
  });
  it('object', () => {
    expect(Object.keys(stubFunctions({})).length).to.equal(0);
  });
  it('array', () => {
    expect(stubFunctions([]).length).to.equal(0);
  });
});
it('can mock prototypeless objects', () => {
  const prototypeless = Object.setPrototypeOf(
    new (class {
      public aFunction() {}
    })(),
    null,
  );
  expect(prototypeless.aFunction).to.undefined;
  const mocked = stubFunctions(prototypeless);
  expect(mocked.aFunction).to.undefined;
});
it('same class instances map to the same mocked class instances', () => {
  class TestClass {}
  const testClass1 = new TestClass();
  const testClass2 = new TestClass();
  const classes = [testClass1, testClass1, testClass2];
  const mockedClasses = stubFunctions(classes, { classInstances: true });
  for (let c = 0; c < classes.length; c++) {
    expect(classes[c]).not.to.equal(mockedClasses[c]);
  }
  expect(mockedClasses[0]).to.equal(mockedClasses[1]);
  expect(mockedClasses[0]).not.to.equal(mockedClasses[2]);
});
it('same original function maps to the same mocked function', () => {
  const aFunction1 = () => {};
  const aFunction2 = () => {};
  const functions = [aFunction1, aFunction1, aFunction2];
  const mockedFunctions = stubFunctions(functions);
  for (let f = 0; f < functions.length; f++) {
    expect(functions[f]).not.to.equal(mockedFunctions[f]);
  }
  expect(mockedFunctions[0]).to.equal(mockedFunctions[1]);
  expect(mockedFunctions[0]).not.to.equal(mockedFunctions[2]);
});

it('cloned instance behaves correctly', () => {
  const array = stubFunctions([2]);
  expect(array[0]).to.equal(2);
  array.push(1);
  expect(array.shift()).to.equal(2);
  expect(array.shift()).to.equal(1);

  class TestClass {
    private _value: number;
    public constructor() {
      this._value = 0;
    }

    public changeValue(newValue) {
      this._value = newValue;
    }
    public get value() {
      return this._value;
    }
  }

  const testInstance = new TestClass();
  testInstance.changeValue(4);
  const mockedInstance = stubFunctions(testInstance);
  expect(testInstance.value).to.equal(4);
  expect(mockedInstance.value).to.undefined;
  mockedInstance.changeValue(10);
  expect(mockedInstance.value).to.undefined;
});

it('Multiple references to functions all map to same mocked function', () => {
  const aFunction = () => {};
  const anObject = {
    fn1: aFunction,
    fn2: aFunction,
  };
  const mockedObject = stubFunctions(anObject);
  expect(anObject.fn1).not.to.equal(mockedObject.fn1);
  expect(mockedObject.fn1).to.equal(mockedObject.fn2);
});

it('undefined', () => {
  expect(stubFunctions(undefined)).to.equal(undefined);
});

it('null', () => {
  expect(stubFunctions(null)).to.equal(null);
});

it('can mock class instances', () => {
  class AClass {
    public fn2;
    public constructor() {
      this.fn2 = () => {
        return 3;
      };
    }
    public fn1() {
      return 1;
    }
  }
  const instance = new AClass();
  const mockedInstance = stubFunctions(instance);
  expect(mockedInstance.fn1()).to.undefined;
  expect(mockedInstance.fn2()).to.undefined;
});

it('instance without constructor', () => {
  const instance = { aFunction: () => 11 };
  instance.constructor = undefined as any;
  const mockedInstance = stubFunctions(instance);
  expect(instance.aFunction()).to.equal(11);
  expect(mockedInstance.aFunction()).not.to.equal(instance.aFunction());
});

describe('classInstance behaves correctly', () => {
  class BClass {
    public innerMethod() {
      return 42;
    }
  }
  class AClass {
    public inner;
    public constructor() {
      this.inner = new BClass();
    }
    public test() {
      return 100;
    }
  }
  it('mocks inner class when true', () => {
    const instance = new AClass();
    const mocked = stubFunctions(instance, { classInstances: true });
    expect(mocked.test()).to.undefined;
    expect(mocked.inner.innerMethod()).to.undefined;
  });
  it('mocks inner class when false', () => {
    const instance = new AClass();
    const mocked = stubFunctions(instance);
    expect(mocked.test()).to.undefined;
    expect(mocked.inner.innerMethod()).to.equal(42);
  });
});

describe('only mocks functions', () => {
  it('with { method() {} }', () => {
    const aObject = {
      method() {
        return 1;
      },
    };
    const mockedObject = stubFunctions(aObject);
    expect(aObject.method()).to.equal(1);
    expect(aObject.method()).not.to.equal(mockedObject.method());
  });
  it('with modules', () => {
    const aModule = require('./es6-module');
    const mockedModule = stubFunctions(aModule);
    expect(mockedModule.someNumber).to.equal(aModule.someNumber);
    expect(mockedModule.someFunction()).not.to.equal(aModule.someFunction());
  });

  it('with object literal', () => {
    const mockedObject = stubFunctions(aObjectLiteral);
    expect(mockedObject.returnObject()).not.to.equal(aObjectLiteral.returnObject());
    Object.getOwnPropertyNames(mockedObject)
      .filter(key => key !== 'returnObject')
      .forEach(key => {
        expect(mockedObject[key]).to.equal(aObjectLiteral[key]);
      });
  });
  it('with array', () => {
    const mockedArray = stubFunctions(anArray);
    // Check that the function (1st element) isn't the same function
    const aFunction = mockedArray.shift();
    const originalFunction: Function = anArray[0] as Function;
    expect(aFunction()).not.to.equal(originalFunction());
    mockedArray.forEach((notAFunction, i) => {
      expect(notAFunction).to.equal(anArray[i + 1]);
    });
  });
});

describe('can mock recursively', () => {
  it('class with object', () => {
    class ClassWithObject {
      public anObject;
      public constructor() {
        this.anObject = {
          aFunction: () => 10,
        };
      }
    }
    const classInstance = new ClassWithObject();
    const mockedInstance = stubFunctions(classInstance, true);
    expect(classInstance.anObject.aFunction()).to.equal(10);
    expect(mockedInstance.anObject.aFunction()).to.undefined;
  });
  it('infinitely deep object', () => {
    const anObject = {};
    anObject['itself'] = anObject;
    stubFunctions(anObject, true);
  });
  it('with Map object', () => {
    const aMap = new Map();
    aMap.set(1, 5);
    const mockedMap = stubFunctions(aMap, true);
    expect(aMap.get(1)).to.equal(5);
    expect(mockedMap.get(1)).to.equal(5);
    expect(mockedMap.has(1)).to.equal(true);
  });

  it('with Set object', () => {
    const aSet = new Set();
    const aFunction = () => {};
    aSet.add(1);
    aSet.add(aFunction);
    const mockedSet = stubFunctions(aSet);
    expect(aSet.has(1)).to.equal(true);
    expect(aSet.has(aFunction)).to.equal(true);
    expect(mockedSet.has(1)).to.equal(true);
    expect(mockedSet.has(aFunction)).to.equal(false);
  });

  it('with {...}', () => {
    const mockedObject = stubFunctions(
      {
        nested: aObjectLiteral,
      },
      true,
    );
    expect(mockedObject.nested.returnObject()).not.to.equal(
      aObjectLiteral.returnObject(),
    );
  });
  it('with array', () => {
    const mockedArray = stubFunctions([anArray], true);
    const originalFunction = anArray[0] as Function;
    expect(mockedArray[0][0]()).not.to.equal(originalFunction());
  });
});

it('only mocks recursively when recursive = true', () => {
  const mockedObject = stubFunctions({
    nested: aObjectLiteral,
  });
  expect(mockedObject.nested.returnObject()).to.equal(aObjectLiteral.returnObject());
});

describe('can mock the function', () => {
  it('new Array(...)', () => {
    const originalValue = new Object();
    const originalArray = new Array(1).fill(() => () => originalValue);
    const mockedArray = stubFunctions(originalArray);
    expect(mockedArray[0]()).not.to.equal(originalArray[0]());
  });
});

describe('onMockedFunction', () => {
  it('works with no parameters', () => {
    const objectWithFunctions = {
      0: () => -202,
      1: () => 10,
    };
    const mockedObject = stubFunctions(objectWithFunctions, undefined, (fn, ogFn) =>
      fn.callsFake(() => ogFn()),
    );
    Object.keys(objectWithFunctions).forEach(key => {
      expect(objectWithFunctions[key]()).to.equal(mockedObject[key]());
    });
  });
  it('works with parameters', () => {
    const arrayWithFunctions = [val => val];
    const mockedArray = stubFunctions(arrayWithFunctions, undefined, (fn, ogFn) =>
      fn.callsFake((...other) => ogFn(...other)),
    );
    Object.keys(mockedArray).forEach(key => {
      expect(mockedArray[key](1337)).to.equal(arrayWithFunctions[key](1337));
    });
  });
});
