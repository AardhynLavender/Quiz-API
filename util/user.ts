import Prisma from "./prismaConfig";
import { Role } from "@prisma/client";
import { Response } from "express";
import { Crud } from "../types/crud";
import { Code } from "../types/http";

const Authorize = async (
  id: number | string | undefined,
  elevation: Array<Role>
): Promise<boolean> => {
  try {
    const user = await GetUser(id);
    return !!user && elevation.includes(user.role);
  } catch (err: unknown) {
    return false;
  }
};

const Unauthorized = (res: Response, action: Crud): Response => {
  return res.status(Code.FORBIDDEN).json({
    msg: `${action.toString()} requires an elevated permission level`,
  });
};

const GetUser = async (id: number | string | undefined) => {
  const user = await Prisma.user.findUnique({
    where: { id: typeof id === "string" ? Number(id) : id },
  });
  return user;
};

export { Authorize, GetUser, Unauthorized };
