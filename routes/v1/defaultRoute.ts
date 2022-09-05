import { Express } from "express";
import { Code } from "../../types/http";

/**
 * Handle the unhandled
 *
 * **This should be invoked after your handled routes**
 * @param app the express app to attach to
 * @param message the message to send to the client when an unhandled route is encountered
 */
const CreateDefaultRoute = (app: Express, message: string): void => {
  app.use((_, res) => res.status(Code.NOTFOUND).json({ msg: message }));
};

export default CreateDefaultRoute;
