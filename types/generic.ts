/* eslint-disable no-unused-vars */

import { Quiz, Role, Submission, User } from "@prisma/client";
export type Table = User | Quiz | Submission;

export interface Authorization {
  success: boolean;
  message: string;
}

export type DataAccess<T> = (data: T, user: User) => Authorization;

export interface Permission<T> {
  unconditionalAccess: Role[]; // Roles who may unconditionally access data
  conditionalAccess: DataAccess<T>; // authorization based on role and returned data
}

export interface AccessPragma<T> {
  create?: Role[];
  read?: Permission<T>;
  readMany?: Role[];
  update?: Permission<T>;
  delete?: Role[];
}

export type HiddenFields = Record<string, string>; // Replace the value of a field with a placeholder

export type Immutability = Record<Role, string[]>; // Fields that cannot be changed

export default interface CrudInterface<T extends Table> {
  name: string;
  model: any;
  schema: string[];
  accessPragma: AccessPragma<T>; // CRUD access permissions
  immutables?: Immutability;
  hiddenFields?: HiddenFields;
  relations?: string[];
  seedGistHash?: Gist; // where to get Seed data
}
