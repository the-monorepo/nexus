import { TypeCheck } from './type-checks.ts';
export type TypeTest<V = any> = {
  typeCheck: (...params: any[]) => boolean;
  value: V;
};

/**
 * Just a helper method for easy construction of a type test
 */
export function typeTest<T>(typeCheck: TypeCheck, value: T): TypeTest<T> {
  return { typeCheck, value };
}
