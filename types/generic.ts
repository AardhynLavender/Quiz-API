/* eslint-disable no-unused-vars */

import { Question, Quiz, Role, Submission, User } from "@prisma/client";
export type Table = User | Quiz | Submission | Question;

export interface Authorization {
  success: boolean;
  message: string;
}

export type DataAccess<T> = (data: T, user: User) => Authorization;

export interface Permission<T> {
  unauthorizedAccess?: Role[]; // Roles that are not allowed to access the data
  unconditionalAccess?: Role[]; // Roles who may unconditionally access data
  conditionalAccess?: DataAccess<T>; // authorization based on role and returned data
}

// permissions for CRUD operations on T
export interface CrudAccessPragma<T> {
  create?: Role[];
  read?: Permission<T>;
  readMany?: Role[];
  update?: Permission<T>;
  delete?: Permission<T>;
}

// Permissions for Seeding pools on T
export interface SeedAccessPragma {
  pool?: string;
  unconditionalAccess: Role[];
}

// Replace the value of a field with a placeholder
export type HiddenFields = Record<string, string>;

// Fields that cannot be changed
export type Immutability = Record<Role, string[]>;

export interface ValidatedField<T extends Table> {
  validator: (fields: Record<keyof T, any>) => Promise<boolean> | boolean;
  message?: string;
}

// fields from the schema that are computed rather than extracted from a request
export interface ComputedField {
  name: string;
  compute: (request: any) => Promise<string | number | object>;
}

export type OnSuccess<T> = (data: T) => Promise<void>;

// describes an interface to a table ( excuse the context overlap of 'interface' )
export default interface CrudInterface<T extends Table> {
  name: string;
  model: any; // eek! explicit any!
  schema: string[];
  nestedWriteSchema?: string[];
  unique: (string | number)[];
  computed?: ComputedField[];
  validated?: ValidatedField<T>[];
  accessPragma: CrudAccessPragma<T>; // CRUD access permissions
  immutables?: Immutability;
  hiddenFields?: HiddenFields;
  relations?: object; // foreign keys
  seed?: SeedAccessPragma[];
  onCreateSuccess?: OnSuccess<T>;
}
