import { defaultTypeTests } from './defaultTypeTests';
import { DefaultTypeInfo, DefaultType } from './type-info-types';
import { runTypeTests } from './runTypeTests';

export function extractTypeInfo<T>(values: T[] | T): DefaultTypeInfo {
  const examples: T[] = Array.isArray(values) ? values : [values];
  const { nullCount, undefinedCount, typeValues } = runTypeTests(
    examples,
    defaultTypeTests(examples, extractTypeInfo),
  );
  const types: DefaultType[] = typeValues.map(callback => callback());
  return {
    nullCount,
    undefinedCount,
    types,
  };
}
