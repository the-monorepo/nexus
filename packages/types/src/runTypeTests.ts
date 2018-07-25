import { Type } from './type-info-types';
import { TypeTest } from './TypeTest';
import { nullCounts, undefinedCounts } from './util';

export function runTypeTests<V = Type>(values, typeTests: TypeTest<V>[]) {
  const undefinedCount = undefinedCounts(values);
  const nullCount = nullCounts(values);
  const passedTests = [];
  for (const typeTest of typeTests) {
    for (const value of values) {
      if (typeTest.typeCheck(value)) {
        passedTests.push(typeTest);
        break;
      }
    }
  }
  return {
    nullCount,
    undefinedCount,
    typeValues: passedTests.map(({ value }) => value),
  };
}
