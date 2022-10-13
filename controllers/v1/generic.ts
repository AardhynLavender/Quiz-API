import { Role } from "@prisma/client";
import { ReturnError as Error } from "./error";
import { Code, RequestHandler } from "../../types/http";
import { HideFields, ReduceToSchema } from "../../util/schema";
import {
  DataAccess,
  Filter,
  HiddenFields,
  Immutability,
  OnSuccess,
  Table,
  ValidatedField,
} from "../../types/generic";
import { Crud, NestedWrite } from "../../types/crud";
import { Authorize, Unauthorized } from "../../util/user";

/**
 * Generic CRUD Controller
 * @author: Aardhyn Lavender
 * @description:  Perform GET, GETs, POST, PUT, and DELETE requests on a table.
 *
 *                This controller is designed to be used with the generic router and CRUD Interface, and therefore:
 *                - Applies POST Field computation, validation, and immutability where specified.
 *                - Applies Unconditional and Conditional Authorization per Role if specified.
 *                - Invokes provided Creation Success Handlers if specified.
 */

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

const CreateGetRequest = <T extends Table>(
  model: any,
  table: string,
  hiddenFields?: HiddenFields,
  relations?: object,
  filters?: Filter,
  unauthorizedAccess?: Role[],
  access?: Role[],
  dataAccess?: DataAccess<T>,
  many = true
): RequestHandler => {
  return many
    ? async (req, res) => {
        try {
          const { role } = req.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

          // Unconditional Access
          if (access && !access.includes(role))
            return Unauthorized(res, Crud.READ);

          // Filtration Extraction
          const option = req.query.filter as string | undefined;

          // Reading
          const data = await model.findMany({
            ...(filters &&
              option &&
              filters[option] && { where: filters[option] }),
            ...(relations && { include: relations }),
          });
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
          const user = req.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
          const { role } = user;

          // Reading
          const { id } = req.params;
          const data = await model.findUnique({
            ...(relations && { include: relations }),
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
      const { id } = req.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      if (access) {
        const authorized = await Authorize(id, access);
        if (!authorized) return Unauthorized(res, Crud.DELETION);
      }

      // extraction
      const attributes: Record<string | keyof T, any> = ReduceToSchema(
        schema,
        req.body
      ) as any;

      // Nested Write Extraction ( `CreateOrConnect` not currently supported )
      const nestedWrites: NestedWrite =
        nestedWriteSchema?.reduce((record, key) => {
          const write = req.body[key];
          return {
            ...record,
            ...(typeof write === "object" && { [key]: { create: write } }),
          };
        }, {}) ?? {};

      // Validation
      if (validators) {
        for (const v of validators) {
          const { validator, message } = v;
          const valid = await validator({ ...attributes, ...nestedWrites });
          if (!valid)
            return res.status(Code.BAD_REQUEST).json({
              msg: message ?? `An invalid value was provided!`,
            });
        }
      }

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
      const user = req.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

      // Data Extraction
      const { id } = req.params;
      const attributes = ReduceToSchema(schema, req.body);

      // Immutability Validation
      const immutables: string[] | undefined = immutability?.[user.role];
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
      if (!access || !access.includes(user.role)) {
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
      const user = req.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

      // Unauthorized Access Authorization
      if (unauthorizedAccess && unauthorizedAccess?.includes(user.role))
        return res.status(Code.FORBIDDEN).json({
          msg: `You do not have permission to delete this records from ${table}`,
        });

      // Unconditional Access Authorization
      if (access && !access.includes(user.role))
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
