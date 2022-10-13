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

/**
 * Generic Router
 * @author Aardhyn Lavender
 * @description Creates Routes for a given model applying the specifications in the CRUD interface
 *
 * API
 *
 * **Operations do not come with a default prefix**
 * The prefix is defined when invoking `CreateRoutes` from `./route.ts`
 * See `App.ts` for examples.
 *
 * Read and Read Many
 *
 * @link GET /[:id]?[filter=<filter>]
 * @param {Header} Authorization - session key
 * @param {Param?} id A specific record to retrieve
 * @param {Query?} filter specify a filter to apply to the query
 *
 * Create
 *
 * @link POST /
 * @param {Header} Authorization - session key
 * @param {Body} data The data to create a new record with
 *
 * Mutation
 *
 * @link PUT /
 * @param {Header} Authorization - session key
 * @param {Body} data The data to update the record with
 * @param {Param} id A specific record to mutate
 *
 * Deletion
 *
 * @link DELETE /
 * @param {Header} Authorization - session key
 * @param {Param} id A specific record to delete
 *
 * Seeding
 *
 * @link POST /seed/:id
 * @param pool The specific pool to seed ( default will be the first pool specified in the Crud Interface )
 * @param {Header} Authorization - session key
 *
 */

const CreateRouter = <T extends Table>({
  name,
  model,
  schema,
  nestedWriteSchema,
  unique,
  accessPragma,
  computed,
  validated,
  filters,
  immutables,
  relations,
  hiddenFields,
  seed,
  onCreateSuccess,
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
            undefined,
            read.unauthorizedAccess,
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
        ? CreateDeleteRequest(
            model,
            name,
            deleteAccess.unauthorizedAccess,
            deleteAccess.unconditionalAccess,
            deleteAccess.conditionalAccess
          )
        : CreateVoidRoute(Crud.DELETION, name)
    );

  router
    .route("/")
    .get(
      CreateGetRequest(
        model,
        name,
        hiddenFields,
        relations,
        filters,
        undefined,
        readMany
      )
    )
    .post(
      createAccess
        ? CreatePostRequest(
            model,
            name,
            schema,
            nestedWriteSchema,
            hiddenFields,
            createAccess,
            validated,
            onCreateSuccess
          )
        : CreateVoidRoute(Crud.CREATION, name)
    );

  return router;
};

export default CreateRouter;
