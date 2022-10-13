import { Router } from "express";
import { Code } from "../../types/http";

/**
 * Root Route
 * @author Aardhyn Lavender
 *
 * @description Returns some user defined data when is requested.
 */

const Root = (message: string, data?: unknown) => {
  const router = Router();
  router.get(``, (_, res) =>
    res.status(Code.SUCCESS).json({ msg: message, data })
  );
  return router;
};

export default Root;
