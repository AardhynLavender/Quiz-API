import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";
import CrudInterface from "../../types/generic";
import { User } from "@prisma/client";
import { CreateFakePassword } from "../../util/string";
import AccessingOwn from "../../util/auth";

/**
 * An interface for the User table
 */
const user: CrudInterface<User> = {
  name: "User",
  model: Prisma.user,
  schema: [
    "id",
    "first_name",
    "last_name",
    "username",
    "email",
    "password",
    "profile_picture_uri",
    "role",
  ],
  unique: ["email", "username"],
  accessPragma: {
    create: undefined, // creation is handled via `/auth/Register`
    read: {
      unconditionalAccess: ["SUPER_USER", "ADMIN_USER"],
      conditionalAccess: (data, user) => AccessingOwn(data, user, "read"), // only allow reading of own data
    },
    readMany: ["SUPER_USER", "ADMIN_USER"],
    update: {
      unconditionalAccess: ["SUPER_USER", "ADMIN_USER"],
      conditionalAccess: (data, user) => AccessingOwn(data, user, "modify"), // only allow mutation of own data
    },
    delete: ["SUPER_USER"],
  },
  immutables: {
    SUPER_USER: ["role"],
    ADMIN_USER: ["role"],
    BASIC_USER: ["role"],
  },
  hiddenFields: {
    password: CreateFakePassword(6, 12),
  },
  seed: [
    {
      unconditionalAccess: ["SUPER_USER"],
      pool: "admin",
    },
    {
      unconditionalAccess: ["SUPER_USER", "ADMIN_USER"],
      pool: "basic",
    },
  ],
};

export default CreateRouter(user);
