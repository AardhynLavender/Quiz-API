import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AssertValid, { AssertEquality } from "../../util/assertion";

import { Code } from "../../http/http";
import { Environment } from "../../util/environment";
import Prisma from "../../util/prismaConfig";
import { Role, User } from "@prisma/client";

interface UserRegistration extends User {
  confirm_password: string;
}

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

const SECOND = 1;
const Sign = (id: number, username: string, invalidate = false) => {
  const token: string = jwt.sign(
    {
      id,
      username,
    },
    Environment.JWT_SECRET,
    { expiresIn: invalidate ? SECOND : Environment.JWT_LIFETIME }
  );
  return token;
};

const Register = async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      confirm_password,
    }: UserRegistration = req.body;
    const user = await Prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (user)
      return res.status(Code.CONFLICT).json({ msg: "User already exists" });

    try {
      AssertValid.FirstName(first_name);
      AssertValid.LastName(last_name);
      AssertValid.Username(username);
      AssertValid.Email(email, username);
      AssertValid.Password(password);
      AssertEquality("password", confirm_password, password);
    } catch (assertion: unknown) {
      // catch errors cased by the client
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
    const { email, username, password }: User = req.body;
    const user = await Prisma.user.findUnique({
      // eslint-disable-next-line no-extra-parens
      where: { ...(email ? { email } : { username }) },
    });

    if (!user)
      return res
        .status(Code.NOTFOUND)
        .json({ msg: "A user is not registered with these credentials" });

    const authenticated = await bcryptjs.compare(password, user.password);

    if (!authenticated)
      return res
        .status(Code.UNAUTHORIZED)
        .json({ msg: "Invalid password/username" });

    const token = Sign(user.id, user.username);

    return res.status(Code.SUCCESS).json({
      msg: `${user.username} has been logged in`,
      token: token,
    });
  } catch (err: any) {
    return res.status(Code.ERROR).json({
      msg: err.message,
    });
  }
};

/**@deprecated*/
const Logout = async (req: Request, res: Response) => {
  try {
    /*
       ...fancy token invalidation code here...
    */
    return res.status(Code.SUCCESS).json({
      msg: "User successfully logged out",
    });
  } catch (err: any) {
    return res.status(Code.ERROR).json({
      msg: err.message,
    });
  }
};
export { Authorize, Register, Login, Logout };
