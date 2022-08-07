import { Response, Request, NextFunction } from "express";
import { User } from "./credentials";

// error codes
enum Code {
  SUCCESS = 200,
  CREATED = 201,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOTFOUND = 404,
  CONFLICT = 409,
  ERROR = 500,
}

interface UserRequest extends Request {
  user?: User;
}

type RequestHandler = (
  req: UserRequest,
  res: Response,
  next?: NextFunction
) => Promise<Response<any, Record<string, any>>>;

export { RequestHandler, Code, UserRequest };
