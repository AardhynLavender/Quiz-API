const CreateFakePassword = (min: number, max: number) =>
  "*".repeat(Math.floor(Math.random() * (max - min + 1) + min));

const ToSentenceCase = (string: string) =>
  `${string.charAt(0).toUpperCase()}${string.slice(1).toLowerCase()}`;

const ToQuietSnakeCase = (string: string) =>
  string.replace(" ", "_").toLowerCase();

const Pluralize = (string: string, quantity?: number) =>
  quantity == undefined ? `${string}s` : quantity == 1 ? string : `${string}s`;

export { CreateFakePassword, ToSentenceCase, ToQuietSnakeCase, Pluralize };
