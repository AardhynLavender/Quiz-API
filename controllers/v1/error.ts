import { Response } from "express";
import { Code } from "../../types/http";

interface Error {
  message: string;
}

const ReturnError = (
  err: Error,
  res: Response
): Response<any, Record<string, any>> => {
  return res.status(Code.ERROR).json({
    msg: err.message,
    data: undefined,
  });
};

export { Error, ReturnError };
