import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AssertValid, { AssertEquality } from "../../util/assertion";
import { Code, UserRequest } from "../../types/http";
import { Environment } from "../../util/environment";
import Prisma from "../../util/prismaConfig";
import { Role, User } from "@prisma/client";
import CreateProfilePictureURI, { HashString } from "../../util/profile";
import { CreateFakePassword } from "../../util/string";
import { StandardHash } from "../../util/auth";

interface UserRegistration extends User {
  confirm_password: string;
}

const SESSION_ATTEMPTS = 3;
const SESSION_ACTIVE = "Unique constraint failed on the fields: (`user_id`)";

const CreateExpiryDate = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000);

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

const GetUser = async (id: number | string | undefined) => {
  const user = await Prisma.user.findUnique({
    where: { id: typeof id === "string" ? Number(id) : id },
  });
  return user;
};

const RevokeSession = async (id: number) =>
  await Prisma.session.delete({ where: { user_id: id } });

const CreateSession = async (id: number) => {
  const token = await Prisma.session.create({
    data: {
      user_id: id,
      expires_at: CreateExpiryDate(parseInt(Environment.SESSION_LIFETIME)),
    },
  });
  if (!token) throw new Error("Failed to create a new session");
  return token.key;
};

const AuthenticatedResponse = (res: Response, username: string, key: string) =>
  res.status(Code.SUCCESS).json({
    msg: `${username} has been logged in`,
    token: key,
  });

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
      AssertValid.Password(password ?? "");
      AssertValid.PasswordConfirmation(password, confirm_password);
    } catch (assertion: unknown) {
      // catch errors cased by the client
      return res.status(Code.BAD_REQUEST).json({
        msg: assertion,
      });
    }

    const hashedPassword = await StandardHash(password);

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

    try {
      const token = await CreateSession(user.id);
      return AuthenticatedResponse(res, user.username, token);
    } catch (error: any) {
      if (error.message.includes(SESSION_ACTIVE)) {
        // User has already logged in, create a new session
        await RevokeSession(user.id);
        const token = await CreateSession(user.id);
        return AuthenticatedResponse(res, user.username, token);
      } else throw new Error(error);
    }
  } catch (error: any) {
    return res.status(Code.ERROR).json({ msg: error.message });
  }
};

const Logout = async (req: UserRequest, res: Response) => {
  try {
    const id = req.user?.id;
    if (!id) throw new Error("No user found... How did you even get in here?");

    await RevokeSession(id);

    return res.status(Code.SUCCESS).json({
      msg: "User successfully logged out",
    });
  } catch (err: any) {
    return res.status(Code.ERROR).json({
      msg: err.message,
    });
  }
};
export { Authorize, GetUser, Register, Login, Logout };
