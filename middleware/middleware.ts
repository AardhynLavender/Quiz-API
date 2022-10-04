import { NextFunction, Response } from "express";
import Prisma from "../util/prismaConfig";
import { Code, UserRequest } from "../types/http";

const prefix = "Bearer ";
const space = " ";

const AuthRoute = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extraction

    const authHeader: string = req.headers.authorization ?? "";
    if (!authHeader.startsWith(prefix))
      return res
        .status(Code.UNAUTHORIZED)
        .json({ msg: "Failed to validate authentication" });

    const token: string = authHeader.split(space)[1];

    // Validation

    const session = await Prisma.session.findUnique({
      where: { key: token },
      include: {
        user: true,
      },
    });

    // Expiration checks

    if (
      !session?.user ||
      (session?.expires_at && session?.expires_at < new Date())
    ) {
      // delete session
      await Prisma.session.delete({ where: { key: token } });
      return res.status(Code.UNAUTHORIZED).json({
        msg: "Session has expired",
      });
    }

    // Application

    req.user = session.user;

    return next
      ? next()
      : res.status(Code.NOTFOUND).json({ msg: "no next function!" });
  } catch (error: any) {
    return res.status(Code.FORBIDDEN).json({
      msg: "Not authorized to access this route",
    });
  }
};

export default AuthRoute;
