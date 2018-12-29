import { defaultTypeTests } from './defaultTypeTests.ts';
import { runTypeTests } from './runTypeTests.ts';
import { DefaultTypeInfo } from './type-info-types.ts';

export function extractTypeInfo<T>(
  examples: T[] | T,
  typeTests = defaultTypeTests(extractTypeInfo),
): DefaultTypeInfo {
  const arrayOfExamples: T[] = Array.isArray(examples) ? examples : [examples];
  const { nullCount, undefinedCount, values } = runTypeTests(arrayOfExamples, typeTests);
  return {
    nullCount,
    undefinedCount,
    types: values.map((value) => value(examples)),
  };
}
