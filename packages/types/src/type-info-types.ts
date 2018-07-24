/*
 * TODO: Not a great file name
 * To be honest, if it didn't sound confusing, I would call this type-types :P
 */
import { DefaultTypeName } from './DefaultTypeName';

export interface Type {
  type: string;
}

export enum NumberFormat {
  none = 'none',
  integer = 'integer',
  // TODO: float
}

export interface NumberType extends Type {
  type: DefaultTypeName.number;
  format: NumberFormat;
}

export interface StringType extends Type {
  type: DefaultTypeName.string;
}

export interface Fields {
  [key: string]: TypeInfo;
}

export interface ObjectType extends Type {
  type: DefaultTypeName.object;
  fields: Fields;
}

export interface ArrayType extends Type {
  type: DefaultTypeName.array;
  items: TypeInfo;
}

export interface FunctionType extends Type {
  type: DefaultTypeName.function;
}

export interface BooleanType extends Type {
  type: DefaultTypeName.boolean;
}

export type DefaultType =
  | NumberType
  | StringType
  | ObjectType
  | ArrayType
  | FunctionType
  | BooleanType;

export interface TypeInfo {
  types: Type[];
  undefinedCount: number;
  nullCount: number;
}

export interface DefaultTypeInfo {
  types: DefaultType[];
  undefinedCount: number;
  nullCount: number;
}
