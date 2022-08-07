import { Role } from "@prisma/client";
import { ReturnError as Error } from "../../http/error";
import { Code, RequestHandler } from "../../http/http";
import { IncludeRelations, ReduceToSchema } from "../../util/schema";
import { Authorize } from "./auth";
import { Response } from "express";

enum Crud {
  CREATION = "creation",
  READ = "read",
  UPDATE = "modification",
  DELETION = "deletion",
}

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

/**
 * Generates a GET handler
 * @param {prisma.model} model
 * @param {string} table
 * @param {boolean} many default `true`
 * @returns A GET handler
 */
const CreateGetRequest = (
  model: any,
  table: string,
  relations?: Array<string>,
  many = true
): RequestHandler =>
  many
    ? async (req, res) => {
        try {
          const data = await model.findMany(
            relations ? IncludeRelations(relations) : {}
          );

          if (!data.length) {
            return res.status(Code.SUCCESS).json({ msg: `No ${table}s found` });
          }

          return res.json({ data });
        } catch (err: any) {
          return Error(err, res);
        }
      }
    : async (req, res) => {
        try {
          const { id } = req.params;
          const data = await model.findUnique({
            where: { id: Number(id) },
          });

          if (!data) {
            return res
              .status(Code.SUCCESS)
              .json({ msg: `No ${table} with the id: ${id} found` });
          }

          return res.status(Code.SUCCESS).json({ data });
        } catch (err: any) {
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
  (model: any, table: string, schema: Array<string>): RequestHandler =>
  async (req, res) => {
    try {
      const attributes = ReduceToSchema(schema, req.body);
      const { id } = req.user ?? { id: undefined };
      const authorized = await Authorize(id, [
        Role.ADMIN_USER,
        Role.SUPER_USER,
      ]);

      if (!authorized) return Unauthorized(res, Crud.CREATION);

      await model.create({
        data: { ...attributes, userId: id },
      });

      const mutated = await model.findMany();
      return res.status(Code.CREATED).json({
        msg: `${table} successfully created`,
        data: mutated,
      });
    } catch (err: any) {
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
  (model: any, table: string, schema: Array<string>): RequestHandler =>
  async (req, res) => {
    try {
      const { id } = req.params;
      const attributes = ReduceToSchema(schema, req.body);

      const data = await model.findUnique({
        where: { id: Number(id) },
      });

      if (!data) {
        return res
          .status(Code.SUCCESS)
          .json({ msg: `No ${table} with the id: ${id} found` });
      }

      const mutated = await model.update({
        where: { id: Number(id) },
        data: { ...attributes },
      });

      return res.status(Code.SUCCESS).json({
        msg: `${table} with the id: ${id} successfully updated`,
        mutated,
      });
    } catch (err: any) {
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
  (model: any, table: string): RequestHandler =>
  async (req, res) => {
    try {
      const { id } = req.params;
      const { id: userId } = req.user ?? { id: undefined };
      const authorized = await Authorize(userId, [Role.SUPER_USER]);

      if (!authorized) return Unauthorized(res, Crud.DELETION);

      const data = await model.findUnique({
        where: { id: Number(id) },
      });

      if (!data) {
        return res
          .status(Code.SUCCESS)
          .json({ msg: `No ${table} with the id: ${id} found` });
      }

      await model.delete({
        where: { id: Number(id) },
      });

      return res.json({
        msg: `${table} with the id: ${id} successfully deleted`,
      });
    } catch (err: any) {
      return Error(err, res);
    }
  };

export {
  CreateGetRequest,
  CreatePostRequest,
  CreatePutRequest,
  CreateDeleteRequest,
};
