import { Role } from "@prisma/client";
import { ReturnError as Error } from "./error";
import { Code, RequestHandler } from "../../types/http";
import { ReduceToSchema } from "../../util/schema";
import { Authorize, GetUser } from "./auth";
import { Response } from "express";
import {
  DataAccess,
  HiddenFields,
  Immutability,
  OnSuccess,
  Table,
  ValidatedField,
} from "../../types/generic";
import { Crud, NestedWrite } from "../../types/crud";

/**
 * Creates and unauthorized response
 * @param res the response to attach to
 * @param action the action that is unauthorized
 * @returns the response with the appropriate error attached
 */
const Unauthorized = (res: Response, action: Crud): Response => {
  return res.status(Code.FORBIDDEN).json({
    msg: `${action.toString()} requires an elevated permission level`,
  });
};

const HideFields = (
  data: Table[],
  hiddenFields?: HiddenFields
): Table[] | Table =>
  hiddenFields
    ? data.map((record: Table) => ({
        ...record,
        ...hiddenFields,
      }))
    : data;

const ResponseData = (
  data: Table[],
  msg: string,
  hiddenFields?: HiddenFields
) => {
  const processed: Table | Table[] = HideFields(data, hiddenFields);
  return {
    msg,
    data: processed,
  };
};

/**
 * Generates a GET handler
 * @param {prisma.model} model
 * @param {string} table
 * @param {boolean} many default `true`
 * @returns A GET handler
 */
const CreateGetRequest = <T extends Table>(
  model: any,
  table: string,
  hiddenFields?: HiddenFields,
  relations?: object,
  unauthorizedAccess?: Role[],
  access?: Role[],
  dataAccess?: DataAccess<T>,
  many = true
): RequestHandler => {
  return many
    ? async (req, res) => {
        try {
          const user = await GetUser(req.user?.id);
          if (!user)
            return res
              .status(Code.UNAUTHORIZED)
              .json({ msg: "No user found! Have you logged in?" });

          const { role } = user; // eslint-disable-line @typescript-eslint/no-non-null-assertion

          // Unconditional Access
          if (access && !access.includes(role))
            return Unauthorized(res, Crud.READ);

          // Reading
          const data = await model.findMany(
            relations ? { include: relations } : {}
          );
          if (!data.length)
            return res.status(Code.SUCCESS).json({ msg: `No ${table}s found` });

          // Response Generation
          const response = ResponseData(
            data,
            `Fetched ${data.length} record${
              data.length > 1 ? "s" : ""
            } from ${table}`,
            hiddenFields
          );
          return res.status(Code.SUCCESS).json(response);
        } catch (err: any) {
          // General Error
          return Error(err, res);
        }
      }
    : async (req, res) => {
        try {
          // Credentials
          const user = await GetUser(req.user?.id);
          if (!user)
            return res
              .status(Code.UNAUTHORIZED)
              .json({ msg: "No user found! Have you logged in?" });
          const { role } = user;

          // Reading
          const { id } = req.params;
          const data = await model.findUnique({
            where: { id: Number(id) },
          });
          if (!data)
            return res
              .status(Code.NOTFOUND)
              .json({ msg: `No ${table} with the id: ${id} found` });

          // Authorization

          if (unauthorizedAccess && unauthorizedAccess?.includes(role))
            return res.status(Code.FORBIDDEN).json({
              msg: `accessing ${table} requires an elevated permission level`,
            });

          if (!access || !access.includes(role))
            if (dataAccess) {
              const access = dataAccess(data, user);
              if (!access.success)
                return res.status(Code.FORBIDDEN).json({
                  msg: access.message,
                });
            }

          // Response Generation
          const response = ResponseData(
            [data],
            `Fetched record ${id} from ${table}`,
            hiddenFields
          );
          return res.status(Code.SUCCESS).json(response);
        } catch (err: any) {
          // General Error
          return Error(err, res);
        }
      };
};

/**
 * Generates a POST request
 * @param {prisma.model} model
 * @param {string} table
 * @param {Array<string>} attributes to extract from the request body
 * @returns A POST handler
 */
const CreatePostRequest =
  <T extends Table>(
    model: any,
    table: string,
    schema: Array<string>,
    nestedWriteSchema?: Array<string>,
    hiddenFields?: HiddenFields,
    access?: Role[],
    validators?: ValidatedField<T>[],
    onCreateSuccess?: OnSuccess<T>
  ): RequestHandler =>
  async (req, res) => {
    try {
      // Authorization
      const { id: userId } = req.user ?? { id: undefined };
      if (access) {
        const authorized = await Authorize(userId, access);
        if (!authorized) return Unauthorized(res, Crud.DELETION);
      }

      // TODO: type ReduceToSchema with generics

      // extraction
      const attributes: Record<keyof T, any> = ReduceToSchema(
        schema,
        req.body
      ) as any;

      // Validation
      if (validators) {
        for (const v of validators) {
          const { validator, message } = v;
          const valid = await validator(attributes);
          if (!valid)
            return res.status(Code.BAD_REQUEST).json({
              msg: message ?? `An invalid value was provided!`,
            });
        }
      }

      // Nested Write Extraction ( `CreateOrConnect` not currently supported )
      const nestedWrites: NestedWrite =
        nestedWriteSchema?.reduce((record, key) => {
          const write = req.body[key];
          return {
            ...record,
            ...(typeof write === "object" && { [key]: { create: write } }),
          };
        }, {}) ?? {};

      // Creation
      const record = await model.create({
        data: { ...attributes, ...nestedWrites },
      });

      // User defined success handler
      try {
        if (onCreateSuccess) await onCreateSuccess(record);
      } catch (e) {
        const response = ResponseData(
          record,
          `Created ${table} with errors in user defined success handler: ${e}`,
          hiddenFields
        );
        return res.status(Code.CREATED).json(response);
      }

      // Response Generation
      const response = ResponseData(
        record,
        `Successfully created ${table}`,
        hiddenFields
      );
      return res.status(Code.CREATED).json(response);
    } catch (err: any) {
      // General Error
      return Error(err, res);
    }
  };

/**
 * Generates a PUT request
 * @param {prisma.model} model
 * @param {string} table
 * @returns A PUT handler
 */
const CreatePutRequest =
  <T extends Table>(
    model: any,
    table: string,
    schema: Array<string>,
    hiddenFields?: HiddenFields,
    immutability?: Immutability,
    access?: Role[],
    dataAccess?: DataAccess<T>
  ): RequestHandler =>
  async (req, res) => {
    try {
      // Authorization
      const user = await GetUser(req.user?.id);
      if (!user)
        return res
          .status(Code.UNAUTHORIZED)
          .json({ msg: "No user found! Have you logged in?" });

      const { role } = user;

      // Data Extraction
      const { id } = req.params;
      const attributes = ReduceToSchema(schema, req.body);

      // Immutability Validation
      const immutables: string[] | undefined = immutability?.[role as Role];
      if (immutables) {
        const immutabilityCrimes = Object.keys(attributes).filter(
          (attribute) => attributes[attribute] && immutables.includes(attribute)
        );
        if (immutabilityCrimes.length)
          return res.status(Code.BAD_REQUEST).json({
            msg: `Whoops! The following fields are immutable: ${immutabilityCrimes.join(
              ", "
            )}`,
          });
      }

      // Nonexistent Record Validation
      const data = await model.findUnique({
        where: { id: Number(id) },
      });
      if (!data) {
        return res
          .status(Code.SUCCESS)
          .json({ msg: `No ${table} with the id: ${id} found` });
      }

      // Authorization
      if (!access || !access.includes(role)) {
        if (dataAccess) {
          const access = dataAccess(data, user);
          if (!access.success)
            return res.status(Code.UNAUTHORIZED).json({
              msg: access.message,
            });
        }
      }

      // Mutation
      const mutated = await model.update({
        where: { id: Number(id) },
        data: { ...attributes },
      });

      // Response Generation
      const response = ResponseData(
        [mutated],
        `${table} with the id: ${id} successfully updated`,
        hiddenFields
      );
      return res.status(Code.SUCCESS).json(response);
    } catch (err: any) {
      // General Error
      return Error(err, res);
    }
  };

/**
 * Generates a DELETE request
 * @param {prisma.model} model
 * @param {string} table
 * @returns A DELETE handler
 */
const CreateDeleteRequest =
  <T extends Table>(
    model: any,
    table: string,
    unauthorizedAccess?: Role[],
    access?: Role[],
    dataAccess?: DataAccess<T>
  ): RequestHandler =>
  async (req, res) => {
    try {
      // Authorization
      const user = await GetUser(req.user?.id);
      if (!user)
        return res
          .status(Code.UNAUTHORIZED)
          .json({ msg: "No user found! Have you logged in?" });

      const { role } = user;

      // Unauthorized Access Authorization
      if (unauthorizedAccess && unauthorizedAccess?.includes(role))
        return res.status(Code.FORBIDDEN).json({
          msg: `You do not have permission to delete this records from ${table}`,
        });

      // Unconditional Access Authorization
      if (access && !access.includes(role))
        return Unauthorized(res, Crud.DELETION);

      // Data Extraction
      const { id } = req.params;
      const data = await model.findUnique({
        where: { id: Number(id) },
      });

      // Nonexistent Record Validation
      if (!data) {
        return res
          .status(Code.SUCCESS)
          .json({ msg: `No ${table} with the id: ${id} found` });
      }

      // Data Access Authorization
      if (dataAccess) {
        const access = dataAccess(data, user);
        if (!access.success)
          return res.status(Code.FORBIDDEN).json({
            msg: access.message,
          });
      }

      // Deletion
      await model.delete({
        where: { id: Number(id) },
      });

      // Response
      return res.status(Code.SUCCESS).json({
        msg: `${table} with the id: ${id} successfully deleted`,
      });
    } catch (err: any) {
      // General Error
      return Error(err, res);
    }
  };

export {
  CreateGetRequest,
  CreatePostRequest,
  CreatePutRequest,
  CreateDeleteRequest,
};
