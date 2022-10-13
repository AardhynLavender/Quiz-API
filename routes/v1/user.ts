import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";
import CrudInterface from "../../types/generic";
import { Role, User } from "@prisma/client";
import { CreateFakePassword } from "../../util/string";
import { AccessingOwn, StandardHash } from "../../util/auth";

/**
 * User Interface ( not to be confused with a user interface )
 * @author Aardhyn Lavender
 *
 * @description   Allows Users to read and edit their own data. While permitting SUPER_USERS
 *                and ADMIN_USERS to read and edit all users with Roles below their own.
 *
 *                Password data is not returned to the client.
 *
 *                No User may change their own, or others' roles.
 *
 *                A Seeding function is provided to create a SUPER_USERs and ADMIN_USERs
 *                - SUPER_USERS can seed from the Admin and Basic pools
 *                - ADMIN_USERS can only seed from the Basic pool
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
      conditionalAccess: (data, user) => {
        const own = AccessingOwn(data, user, "modify");
        if (own.success) return own;

        if (user.role === Role.SUPER_USER)
          return data.role === Role.SUPER_USER
            ? {
                success: false,
                message: "SUPER_USERS cannot modify other SUPER_USERS",
              }
            : { success: true, message: "ok" };

        if (user.role === Role.ADMIN_USER)
          return data.role === Role.ADMIN_USER
            ? {
                success: false,
                message: "ADMIN_USERS cannot modify other ADMIN_USERS",
              }
            : { success: true, message: "ok" };

        return own;
      }, // only allow mutation of own data
    },
    delete: {
      unauthorizedAccess: ["ADMIN_USER", "BASIC_USER"],
      conditionalAccess: (data, _) => {
        return data.role === "SUPER_USER"
          ? {
              success: false,
              message:
                "Although you are powerful, you are not *all* powerful! SUPER_USERS may not be deleted",
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
