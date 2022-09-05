import { Role } from "@prisma/client";
import { ReturnError as Error } from "./error";
import { Code, RequestHandler } from "../../types/http";
import { IncludeRelations, ReduceToSchema } from "../../util/schema";
import { Authorize, GetUser } from "./auth";
import { Response } from "express";
import {
  DataAccess,
  HiddenFields,
  Immutability,
  Table,
} from "../../types/generic";
import { Crud } from "../../types/crud";

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
  relations?: Array<string>,
  access?: Role[],
  dataAccess?: DataAccess<T>,
  many = true
): RequestHandler =>
  many
    ? async (req, res) => {
        try {
          const user = await GetUser(req.user?.id);
          if (!user)
            return res
              .status(Code.UNAUTHORIZED)
              .json({ msg: "No user found! Have you logged in?" });

          const { role } = user; // eslint-disable-line @typescript-eslint/no-non-null-assertion

          // Reading
          const data = await model.findMany(
            relations ? IncludeRelations(relations) : {}
          );
          if (!data.length)
            return res.status(Code.SUCCESS).json({ msg: `No ${table}s found` });

          // Unconditional Access
          if (!access || !access.includes(role))
            return Unauthorized(res, Crud.READ);

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
              .status(Code.SUCCESS)
              .json({ msg: `No ${table} with the id: ${id} found` });

          // Authorization
          if (!access || !access.includes(role))
            if (dataAccess) {
              const access = dataAccess(data, user);
              if (!access.success)
                return res.status(Code.UNAUTHORIZED).json({
                  msg: access.message,
                });
            } else return Unauthorized(res, Crud.READ);

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

/**
 * Generates a POST request
 * @param {prisma.model} model
 * @param {string} table
 * @param {Array<string>} attributes to extract from the request body
 * @returns A POST handler
 */
const CreatePostRequest =
  (
    model: any,
    table: string,
    schema: Array<string>,
    hiddenFields?: HiddenFields,
    access?: Role[]
  ): RequestHandler =>
  async (req, res) => {
    try {
      // Authorization
      const { id: userId } = req.user ?? { id: undefined };
      if (access) {
        const authorized = await Authorize(userId, access);
        if (!authorized) return Unauthorized(res, Crud.DELETION);
      }

      // Creation
      const attributes = ReduceToSchema(schema, req.body);
      await model.create({
        data: { ...attributes },
      });

      // Response Generation
      const mutated = await model.findMany();
      const response = ResponseData(
        mutated,
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
      const { id: userId, role } = user;

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
        } else return Unauthorized(res, Crud.READ);
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
  (
    model: any,
    table: string,
    access: Role[] = [Role.SUPER_USER]
  ): RequestHandler =>
  async (req, res) => {
    try {
      // Authorization
      const { id: userId } = req.user ?? { id: undefined };
      const authorized = await Authorize(userId, access);
      if (!authorized) return Unauthorized(res, Crud.DELETION);

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
