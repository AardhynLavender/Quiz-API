import { Express } from "express";
import { Code } from "../../types/http";

/**
 * Default Route Handler
 * @author Aardhyn Lavender
 * @description   Default Route Handler is used to handle all unknown arbirary routes.
 *                Please Create this Router after all other routers have been created.
 *
 * API
 *
 * @link *
 *
 */

const CreateDefaultRoute = (app: Express, message: string): void => {
  app.use((_, res) => res.status(Code.NOTFOUND).json({ msg: message }));
};

export default CreateDefaultRoute;
