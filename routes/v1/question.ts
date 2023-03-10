import { Question, Role } from "@prisma/client";
import CrudInterface from "../../types/generic";
import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";

/**
 * Question Interface
 * @author Aardhyn Lavender
 *
 * @description   Read Questions and their possible answers from the database
 *                No, you can't see which answers are correct, silly!
 *
 *                SUPER_USERs and ADMIN_USERs can update. SUPER_USERs can delete.
 */

const question: CrudInterface<Question> = {
  name: "Question",
  model: Prisma.question,
  schema: [],
  unique: ["id"],
  relations: {
    answers: {
      select: {
        text: true,
        id: true,
      },
    },
  },
  accessPragma: {
    create: undefined,
    read: {
      unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER, Role.BASIC_USER],
    },
    readMany: [Role.SUPER_USER, Role.ADMIN_USER, Role.BASIC_USER],
    update: { unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER] },
    delete: { unconditionalAccess: [Role.SUPER_USER] },
  },
  immutables: {
    SUPER_USER: ["quiz_id", "question_type"],
    ADMIN_USER: ["quiz_id", "question_type"],
    BASIC_USER: [],
  },
};

export default CreateRouter(question);
