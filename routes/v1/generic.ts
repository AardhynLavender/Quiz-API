import { Router } from "express";

import {
  CreateGetRequest,
  CreatePostRequest,
  CreatePutRequest,
  CreateDeleteRequest,
} from "../../controllers/v1/generic";
import CreateSeedRequest from "../../controllers/v1/seed";
import CrudInterface, { Table } from "../../types/generic";
import CreateVoidRoute from "../../controllers/v1/void";
import { Crud } from "../../types/crud";
import { Environment } from "../../util/environment";

const CreateRouter = <T extends Table>({
  name,
  model,
  schema,
  unique,
  accessPragma,
  computed,
  immutables,
  relations,
  hiddenFields,
  seed,
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
  if (seed && seed.length)
    if (Environment.SEED_GIST_HASH) {
      const { unconditionalAccess, pool } = seed[0];

      // seed route helper function
      const request = (pool: string | undefined) =>
        CreateSeedRequest(
          model,
          name,
          unconditionalAccess,
          unique,
          computed,
          pool
        );

      // first seed will be default
      router.route("/seed").post(request(pool));
      if (seed.length > 1)
        seed.forEach(({ pool }) => {
          // optionally specify a seed pool
          router.route(`/seed/${pool}`).post(request(pool));
        });
    } else
      console.error(
        `WARN: Unable to create /Seed route for ${name} Crud Interface!\n      No GITHUB_GIST_HASH could be found. Has it been defined within /.env?`
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
