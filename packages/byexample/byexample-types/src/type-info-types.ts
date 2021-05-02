/*
 * TODO: Not a great file name
 * To be honest, if it didn't sound confusing, I would call this type-types :P
 */
import { DefaultTypeName } from './DefaultTypeName.ts';

export type Type = {
  name: string;
  [k: string]: any;
};

export enum NumberFormat {
  none = 'none',
  integer = 'integer',
  // TODO: float
}

export type NumberType = {
  name: DefaultTypeName.number;
  format: NumberFormat;
} & Type;

export type StringType = {
  name: DefaultTypeName.string;
} & Type;

export type Fields = {
  [key: string]: TypeInfo;
};

export type ObjectType = {
  name: DefaultTypeName.object;
  fields: Fields;
} & Type;

export type ArrayType = {
  name: DefaultTypeName.array;
  items: TypeInfo;
} & Type;

export type FunctionType = {
  name: DefaultTypeName.function;
} & Type;

export type BooleanType = {
  name: DefaultTypeName.boolean;
} & Type;

export type DefaultType =
  | NumberType
  | StringType
  | ObjectType
  | ArrayType
  | FunctionType
  | BooleanType;

export type TypeInfo = {
  types: Type[];
  undefinedCount: number;
  nullCount: number;
};

export type DefaultTypeInfo = {
  types: DefaultType[];
  undefinedCount: number;
  nullCount: number;
};
