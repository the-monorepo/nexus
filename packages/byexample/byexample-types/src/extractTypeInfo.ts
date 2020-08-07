import { defaultTypeTests } from './defaultTypeTests';
import { runTypeTests } from './runTypeTests';
import { DefaultTypeInfo, DefaultType } from './type-info-types';

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
