import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types/credentials";
import { Code, UserRequest } from "../types/http";
import { Environment } from "../util/environment";

const prefix = "Bearer ";
const space = " ";

const AuthRoute = (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader: string = req.headers.authorization ?? "";
    if (!authHeader.startsWith(prefix))
      return res
        .status(Code.FORBIDDEN)
        .json({ msg: "Failed to validate authentication" });

    const token: string = authHeader.split(space)[1];
    const payload = jwt.verify(token, Environment.JWT_SECRET);

    if (typeof payload === "string") throw "Invalid payload";
    req.user = payload as User;

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
