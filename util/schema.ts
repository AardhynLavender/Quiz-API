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
    const value: number | undefined = parseInt(body[field]);
    return {
      ...attributes,
      [field]: isNaN(value) ? body[field] : value, // convert to number if !NaN
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
