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
    const valueUntyped = body[field];
    const value: number | undefined = parseInt(valueUntyped);
    return {
      ...attributes,
      [field]: Date.parse(valueUntyped)
        ? new Date(valueUntyped)
        : isNaN(value)
        ? (valueUntyped as string) //eslint-disable-line no-extra-parens
        : (value as number), //eslint-disable-line no-extra-parens
    };
  }, {});

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
