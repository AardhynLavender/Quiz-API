/* eslint-disable no-unused-vars */

import { Quiz, Role, Submission, User } from "@prisma/client";
import { Request } from "express";
export type Table = User | Quiz | Submission;

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

// fields from the schema that are computed rather than extracted from a request
export interface ComputedValue {
  name: string;
  compute: (request: any) => Promise<string | number | object>;
}

export type OnSuccess<T> = (data: T) => Promise<void>;

// describes an interface to a table ( excuse the context overlap of 'interface' )
export default interface CrudInterface<T extends Table> {
  name: string;
  model: any; // eek! explicit any!
  schema: string[];
  unique: (string | number)[];
  computed?: ComputedValue[];
  accessPragma: CrudAccessPragma<T>; // CRUD access permissions
  immutables?: Immutability;
  hiddenFields?: HiddenFields;
  relations?: string[]; // foreign keys
  seed?: SeedAccessPragma[];
  onCreateSuccess?: OnSuccess<T>;
}
