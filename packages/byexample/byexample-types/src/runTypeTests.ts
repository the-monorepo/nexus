import { TypeTest } from './TypeTest';
import { Type } from './type-info-types';
import { nullCounts, undefinedCounts } from './util';

export function runTypeTests(
  values,
  typeTests: TypeTest<Type>[] | { [k: string]: TypeTest<Type> },
) {
  const undefinedCount = undefinedCounts(values);
  const nullCount = nullCounts(values);
  const passedTests = Object.keys(typeTests)
    .map((key) => typeTests[key])
    .filter((typeTest) => {
      for (const value of values) {
        if (typeTest.typeCheck(value)) {
          return true;
        }
      }
      return false;
    });
  return {
    nullCount,
    undefinedCount,
    values: passedTests.map(({ value }) => value),
  };
}
