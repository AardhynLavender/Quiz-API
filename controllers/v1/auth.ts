import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { Code } from "../../http/http";
import { Environment } from "../../util/environment";
import Prisma from "../../util/prismaConfig";
import { Role, User } from "@prisma/client";

const Authorize = async (
  id: number | string | undefined,
  elevation: Array<Role>
): Promise<boolean> => {
  try {
    const user = await Prisma.user.findUnique({
      where: { id: typeof id === "string" ? Number(id) : id },
    });
    return !!user && elevation.includes(user.role);
  } catch (err: any) {
    return false;
  }
};

const register = async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, role }: User = req.body;
    const user = await Prisma.user.findUnique({ where: { email } });

    if (user)
      return res.status(Code.CONFLICT).json({ msg: "User already exists" });

    const salt = await bcryptjs.genSalt();
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = await Prisma.user.create({
      data: { name, username, email, password: hashedPassword, role },
    });

    return res.status(Code.CREATED).json({
      msg: "User successfully registered",
      data: { ...newUser, password: "*************" },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(Code.ERROR).json({
      msg: err.message,
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, username, password }: User = req.body;

    const predicate = email ? { email } : { username };
    const user = await Prisma.user.findUnique({
      where: { ...predicate },
    });

    if (!user)
      return res
        .status(Code.UNAUTHORIZED)
        .json({ msg: "A user is not registered with these credentials" });

    const authenticated = await bcryptjs.compare(password, user.password);

    if (!authenticated)
      return res
        .status(Code.UNAUTHORIZED)
        .json({ msg: "Invalid password/username" });

    const token: string = jwt.sign(
      {
        id: user.id,
        name: user.name,
      },
      Environment.JWT_SECRET,
      { expiresIn: Environment.JWT_LIFETIME }
    );

    return res.status(Code.SUCCESS).json({
      msg: "User successfully logged in",
      token: token,
    });
  } catch (err: any) {
    return res.status(Code.ERROR).json({
      msg: err.message,
    });
  }
};

export { Authorize, register, login };
