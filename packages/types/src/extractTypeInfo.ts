import { defaultTypeTests } from './defaultTypeTests';
import { DefaultTypeInfo, DefaultType } from './type-info-types';
import { runTypeTests } from './runTypeTests';

export function extractTypeInfo(values): DefaultTypeInfo {
  const { nullCount, undefinedCount, typeValues } = runTypeTests(
    values,
    defaultTypeTests(values, extractTypeInfo),
  );
  const types: DefaultType[] = typeValues.map(callback => callback());
  return {
    nullCount,
    undefinedCount,
    types,
  };
}
