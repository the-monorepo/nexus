import { inputs } from './suites.ts';
import { TestInputs } from './test-inputs.ts';

export function union<T>(...sets: Set<T>[]) {
  const unionSet: Set<T> = new Set();
  for (const set of sets) {
    for (const value of set) {
      unionSet.add(value);
    }
  }
  return unionSet;
}

export function expandInputs(...validTestInputs: TestInputs[]) {
  const validInputs: Set<any> = union(...validTestInputs.map((i) => i.valid));
  const invalidInputs: Set<any> = union(...validTestInputs.map((i) => i.invalid));
  Object.keys(inputs).forEach((key) => {
    const { valid, invalid } = inputs[key];
    for (const invalidValue of invalid) {
      if (validInputs.has(invalidValue)) {
        // Suggests that this suite of inputs might have overlapping values with the valid test inputs
        // despite not being included in the validTestInputs parameter
        return;
      }
    }
    for (const validValue of valid) {
      if (validInputs.has(validValue)) {
        // Don't want overlapping valid test inputs when they should be invalid
        return;
      }
    }
    for (const value of invalid) {
      invalidInputs.add(value);
    }
    for (const value of valid) {
      invalidInputs.add(value);
    }
  });
  invalidInputs.add(null);
  invalidInputs.add(undefined);
  return {
    valid: validInputs,
    invalid: invalidInputs,
  };
}
