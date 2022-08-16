import { Router } from "express";

import {
  CreateGetRequest,
  CreatePostRequest,
  CreatePutRequest,
  CreateDeleteRequest,
} from "../../controllers/v1/generic";
import CreateSeedRequest from "../../controllers/v1/seed";
import { Environment } from "../../util/environment";

/**
 * Creates a standard router for the model
 * @param {PrismaClient.model} model
 * @param {string} table
 * @param {Array<string>} schema
 * @param {Array<string>} relations
 * @returns {Router} router
 */
const CreateRouter = (
  model: any,
  table: string,
  schema: Array<string>,
  relations?: Array<string>,
  seedGistHash?: string,
  gitHubUsername?: string
): Router => {
  const router = Router();
  if (seedGistHash && gitHubUsername)
    router
      .route("/seed")
      .post(
        CreateSeedRequest(
          model,
          table,
          seedGistHash,
          Environment.GITHUB_USERNAME
        )
      );
  router
    .route("/:id")
    .get(CreateGetRequest(model, table, relations, false))
    .put(CreatePutRequest(model, table, schema))
    .delete(CreateDeleteRequest(model, table));
  router
    .route("/")
    .get(CreateGetRequest(model, table, relations))
    .post(CreatePostRequest(model, table, schema));

  return router;
};

export default CreateRouter;
