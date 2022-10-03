import { isDate } from "util/types";

/**
 * reduces an a request `body` to a the elements in the `schema`
 * @param {Array<string>} schema to reduce to
 * @param {*} body to be reduced
 * @returns a request body containing only elements in the schema
 */
const ReduceToSchema = (
  schema: Array<string>,
  body: any
): Record<string, string | number | object> =>
  schema.reduce((attributes, field) => {
    return {
      ...attributes,
      [field]: ParseString(body[field]),
    };
  }, {});

const ParseString = (value: string | number): number | Date | string => {
  if (typeof value === "string") {
    const date = Date.parse(value);
    return !isNaN(Date.parse(value)) ? new Date(date) : value;
  } else return value;
};

/**
 * creates an include object for prisma
 * @param joins array of tables to include
 * @returns an include object
 */
const IncludeRelations = (
  joins: Array<string>
): { include: Record<string, boolean> } => ({
  include: joins.reduce((acc, table) => ({ ...acc, [table]: true }), {}),
});

export { ReduceToSchema, IncludeRelations };
