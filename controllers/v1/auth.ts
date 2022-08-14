import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AssertValid from "../../util/assertion";

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
  } catch (err: unknown) {
    return false;
  }
};

const CreateProfilePictureURI = (hash: number) =>
  `https://avatars.dicebear.com/api/human/${hash}.svg`;

const coefficient = 5; // darn magic numbers again...
const HashString = (string: string) => {
  return Array.from(string).reduce((fullHash, _, index) => {
    const charCode = string.charCodeAt(index);
    const hash: number = (fullHash << coefficient) - fullHash + charCode;
    return hash;
  }, 0);
};

const CreateFakePassword = (min: number, max: number) =>
  "*".repeat(Math.floor(Math.random() * (max - min + 1) + min));

const Register = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, username, email, password }: User = req.body;
    const user = await Prisma.user.findUnique({ where: { email } });
    if (user)
      return res.status(Code.CONFLICT).json({ msg: "User already exists" });

    try {
      AssertValid.FirstName(first_name);
      AssertValid.LastName(last_name);
      AssertValid.Username(username);
      AssertValid.Email(email, username);
      AssertValid.Password(password);
    } catch (assertion: unknown) {
      return res.status(Code.BAD_REQUEST).json({
        msg: assertion,
      });
    }

    const salt = await bcryptjs.genSalt();
    const hashedPassword = await bcryptjs.hash(password, salt);

    const userHash: number = HashString(email + username);
    const profilePictureUri = CreateProfilePictureURI(userHash);

    // Creation

    const newUser = await Prisma.user.create({
      data: {
        first_name,
        last_name,
        username,
        profile_picture_uri: profilePictureUri,
        email,
        password: hashedPassword,
        role: Role.BASIC_USER, //
      },
    });

    return res.status(Code.CREATED).json({
      msg: "User successfully registered",
      data: { ...newUser, password: CreateFakePassword(6, 12) },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(Code.ERROR).json({
      msg: err.message || err || "An error occurred",
    });
  }
};

const Login = async (req: Request, res: Response) => {
  try {
    const { email, password }: User = req.body;
    const user = await Prisma.user.findUnique({
      where: { email },
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
        name: user.username,
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

export { Authorize, Register, Login };
