import { Prisma } from "@prisma/client";

import { Router } from "express";

import {
  CreateGetRequest,
  CreatePostRequest,
  CreatePutRequest,
  CreateDeleteRequest,
} from "../../controllers/v1/generic";
import CreateSeedRequest from "../../controllers/v1/seed";

/**
 * Creates a standard router for the model
 * @param {PrismaClient.model} model
 * @param {string} table
 * @param {Array<string>} schema
 * @returns {Router} router
 */
const CreateRouter = (
  model: Prisma.InstitutionDelegate<any> | Prisma.DepartmentDelegate<any>,
  table: string,
  schema: Array<string>,
  seedGistHash: string,
  relations?: Array<string>
): Router => {
  const router = Router();
  router.route("/seed").post(CreateSeedRequest(model, table, seedGistHash));
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
