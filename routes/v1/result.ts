import { Role, Result } from "@prisma/client";
import CrudInterface from "types/generic";
import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";

const submission: CrudInterface<Result> = {
  name: "Result",
  model: Prisma.result,
  schema: [],
  unique: ["id"],
  accessPragma: {
    create: [Role.ADMIN_USER, Role.SUPER_USER],
    read: {
      unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER, Role.BASIC_USER],
    },
    readMany: [Role.SUPER_USER, Role.ADMIN_USER, Role.BASIC_USER],
    update: { unconditionalAccess: [Role.SUPER_USER] },
    delete: { unconditionalAccess: [Role.SUPER_USER] },
  },
  relations: {
    winner: {
      select: {
        first_name: true,
        last_name: true,
      },
    },
  },
};

export default CreateRouter(submission);
