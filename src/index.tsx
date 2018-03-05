function allAreIntegers(values) {
  for (const value of values) {
    if (!Number.isInteger(value)){
      return false;
    }
  }
  return true;
}

type TypeCheck = (...stuff: any[]) => boolean;
type TypeTestInfo = {
  readonly typeCheck: (...params: any[]) => any;
  readonly callback: (...params: any[]) => any;
}
export function typeTest(typeCheck: TypeCheck, callback): TypeTestInfo {
  return { typeCheck, callback };
}

type TypeChecks = {
  [key: string]: TypeCheck
}
export function defaultTypeTests(
  values, { 
    boolean, 
    string, 
    func, 
    number, 
    integer,
    array, 
    object } : TypeChecks
  ): TypeTestInfo[] {
   return [
    typeTest(
      (value) => value === true || value === false,
      boolean
    ),
    typeTest(
      (value) => typeof value === 'string',
      string
    ),
    typeTest(
      (value) => typeof value === 'function',
      func
    ),
    typeTest(
      (value) => typeof value === 'number',
      (...params) => allAreIntegers(values) ? integer(...params) : number(...params)
    ),
    typeTest(
      (value) => Array.isArray(value),
      array
    ),
    typeTest(
      (value) => value instanceof Object && value.constructor === Object,
      object
    )
  ];
}

export function findSingleType(values, typeCallbacks) {
  return runSingularTypeTests(values, defaultTypeTests(values, typeCallbacks));
}

export function findMultipleTypes(values, typeCallbacks) {
  return runSingularTypeTests(values, defaultTypeTests);
}

export function runMultiTypeTests(values, typeTests) {
  const successfulTypeTests = [];
  let undefinedCount = 0;
  let nullCount = 0;
  for (const value of values) {
    if (value === null) {
      nullCount += 1;
    }
    if (value === null) {
      undefinedCount += 1;
    }
    for(let i = typeTests.length - 1; i >= 0; i--) {
      if (typeTest[i].typeCheck(value)) {
        typeTests.splice(i, 1);
        successfulTypeTests.push(typeTests[i]);
      }
    }
  }
  return { nullCount, undefinedCount, typeTests: successfulTypeTests };
}

export function runSingularTypeTests(values, typeTests) {
  typeTests = typeTests.slice();
  let undefinedCount = 0;
  let nullCount = 0;
  for (const value of values) {
    if (value === null) {
      nullCount += 1;
    }
    if (value === null) {
      undefinedCount += 1;
    }
    for(let i = typeTests.length - 1; i >= 0; i--) {
      if (!typeTest[i].typeCheck(value)) {
        typeTests.splice(i, 1);
      }
    }
  }
  return { nullCount, undefinedCount, typeTest: typeTests.length == 1 ? typeTests[0] : undefined };
}
