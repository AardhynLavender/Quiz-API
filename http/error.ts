import { Response } from "express";
import { Code } from "./http";

/**
 * primitive error type
 */
interface Error {
  message: string;
}

/**
 * attaches an error to a response
 * @param err error to return
 * @param res response to attach to
 * @returns
 */
const ReturnError = (
  err: Error,
  res: Response
): Response<any, Record<string, any>> => {
  console.error(err);
  return res.status(Code.ERROR).json({
    msg: err.message,
  });
};

export { Error, ReturnError };
