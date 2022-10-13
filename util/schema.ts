import { HiddenFields, Table } from "../types/generic";

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

const ParseString = (value: string | number): number | Date | string => {
  if (typeof value === "string") {
    const date = Date.parse(value);
    return !isNaN(Date.parse(value)) ? new Date(date) : value;
  } else return value;
};

export { ReduceToSchema, HideFields };
