import { Express, Router } from "express";
import { BASE_URL, CURRENT_VERSION } from "../../api";
import middleware from "../../middleware/middleware";

const CreateRoute = (
  app: Express,
  router: Router,
  endpoint: string,
  skipMiddleware = false,
  usePrefix = true
): void => {
  const url = `/${
    usePrefix ? `${BASE_URL}/${CURRENT_VERSION}` : ""
  }/${endpoint}`;
  skipMiddleware ? app.use(url, router) : app.use(url, middleware, router);
};

export default CreateRoute;
