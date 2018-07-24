import { DefaultTypeName } from './DefaultTypeName';

export interface Type {
  type: string;
}

export interface NumberType extends Type {
  type: DefaultTypeName.number;
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
  items: TypeInfo[];
}

export interface FunctionType extends Type {
  type: DefaultTypeName.function;
}

export interface BooleanType extends Type {
  type: DefaultTypeName.boolean;
}

export interface TypeInfo {
  types:
    | NumberType
    | StringType
    | ObjectType
    | ArrayType
    | FunctionType
    | BooleanType
    | Type[];
  undefinedCount: number;
  nullCount: number;
}
