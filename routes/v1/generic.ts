import { Router } from "express";

import {
  CreateGetRequest,
  CreatePostRequest,
  CreatePutRequest,
  CreateDeleteRequest,
} from "../../controllers/v1/generic";
import CreateSeedRequest from "../../controllers/v1/seed";
import { Environment } from "../../util/environment";
import CrudInterface, { Table } from "../../types/generic";
import CreateVoidRoute from "../../controllers/v1/void";
import { Crud } from "../../types/crud";

const CreateRouter = <T extends Table>({
  name,
  model,
  schema,
  accessPragma,
  immutables,
  relations,
  hiddenFields,
  seedGistHash,
}: CrudInterface<T>): Router => {
  const router = Router();
  const {
    read,
    update,
    create: createAccess,
    readMany,
    delete: deleteAccess,
  } = accessPragma;

  // Seeding
  if (seedGistHash)
    router
      .route("/seed")
      .post(
        CreateSeedRequest(
          model,
          name,
          seedGistHash,
          Environment.GITHUB_USERNAME
        )
      );

  // Single Record Operations
  router
    .route("/:id")
    .get(
      read
        ? CreateGetRequest(
            model,
            name,
            hiddenFields,
            relations,
            read.unconditionalAccess,
            read.conditionalAccess,
            false
          )
        : CreateVoidRoute(Crud.READ, name)
    )
    .put(
      update
        ? CreatePutRequest(
            model,
            name,
            schema,
            hiddenFields,
            immutables,
            update.unconditionalAccess,
            update.conditionalAccess
          )
        : CreateVoidRoute(Crud.UPDATE, name)
    )
    .delete(
      deleteAccess
        ? CreateDeleteRequest(model, name, deleteAccess)
        : CreateVoidRoute(Crud.DELETION, name)
    );

  router
    .route("/")
    .get(CreateGetRequest(model, name, hiddenFields, relations, readMany))
    .post(
      createAccess
        ? CreatePostRequest(model, name, schema, hiddenFields, createAccess)
        : CreateVoidRoute(Crud.CREATION, name)
    );

  return router;
};

export default CreateRouter;
