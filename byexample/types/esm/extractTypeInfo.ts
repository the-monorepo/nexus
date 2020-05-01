import { defaultTypeTests } from './defaultTypeTests';
import { DefaultTypeInfo, DefaultType } from './type-info-types';
import { runTypeTests } from './runTypeTests';

export function extractTypeInfo<T>(
  examples: T[] | T,
  typeTests = defaultTypeTests(extractTypeInfo),
): DefaultTypeInfo {
  const arrayOfExamples: T[] = Array.isArray(examples) ? examples : [examples];
  const { nullCount, undefinedCount, values } = runTypeTests(arrayOfExamples, typeTests);
  return {
    nullCount,
    undefinedCount,
    types: values.map(value => value(examples)),
  };
}
