import { defaultTypeTests } from './defaultTypeTests';
import { DefaultTypeInfo, DefaultType } from './type-info-types';
import { runTypeTests } from './runTypeTests';

export function extractTypeInfo<T>(
  examples: T[] | T,
  createTypeTestsFn = defaultTypeTests,
): DefaultTypeInfo {
  const arrayOfExamples: T[] = Array.isArray(examples) ? examples : [examples];
  const { nullCount, undefinedCount, values } = runTypeTests(
    arrayOfExamples,
    createTypeTestsFn(examples, extractTypeInfo),
  );
  return {
    nullCount,
    undefinedCount,
    types: values.map(value => value()),
  };
}
