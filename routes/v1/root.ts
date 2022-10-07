import { BASE_URL, CURRENT_VERSION } from "../../api";
import { Router } from "express";
import { VERSION } from "ts-node";
import { Code } from "../../types/http";

/**
 * Return data for the root route.
 * @param app the express app to attach to
 * @param data the data to return
 * @param message the message to send to the client
 *
 */
const Root = (message: string, data?: unknown) => {
  const router = Router();
  router.get(``, (_, res) =>
    res.status(Code.SUCCESS).json({ msg: message, data })
  );
  return router;
};

export default Root;
