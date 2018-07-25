import { TypeCheck } from './type-checks';
export type TypeTest<V = any> = {
  readonly typeCheck: (...params: any[]) => boolean;
  readonly value: V;
};

/**
 * Just a helper method for easy construction of a type test
 */
export function typeTest<T>(typeCheck: TypeCheck, value: T): TypeTest<T> {
  return { typeCheck, value };
}
