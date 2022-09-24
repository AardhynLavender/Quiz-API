import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";
import CrudInterface from "../../types/generic";
import { User } from "@prisma/client";
import { CreateFakePassword } from "../../util/string";
import { AccessingOwn, StandardHash } from "../../util/auth";

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
    delete: {
      unauthorizedAccess: ["ADMIN_USER", "BASIC_USER"],
      conditionalAccess: (data, _) => {
        return data.role === "SUPER_USER"
          ? {
              success: false,
              message:
                "Although you are powerful, you are not all powerful! SUPER_USERS may not be deleted",
            }
          : { success: true, message: "ok" };
      },
    },
  },
  immutables: {
    SUPER_USER: ["role"],
    ADMIN_USER: ["role"],
    BASIC_USER: ["role"],
  },
  computed: [
    {
      name: "password",
      compute: async ({ password }) => await StandardHash(password),
    },
  ],
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
