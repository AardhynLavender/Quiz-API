export enum Crud {
  CREATION = "creation",
  READ = "read",
  UPDATE = "modification",
  DELETION = "deletion",
}

export interface NestedWrite {
  [x: string]: {
    create: NestedWrite | object;
  };
}
