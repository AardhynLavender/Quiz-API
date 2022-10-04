type EnvironmentVariable =
  | "DATABASE_URL"
  | "SHADOW_DATABASE_URL"
  | "PORT"
  | "SESSION_LIFETIME"
  | "SEED_GIST_HASH"
  | "GITHUB_USERNAME"
  | "NODE_ENV"
  | string;

const Environment: Record<EnvironmentVariable, string> = {};

/* does the process contain the provided variable
 * @param variable environment variables to assert
 */
const AssertEnvironmentVariable = (variable: EnvironmentVariable) => {
  const value = process.env[variable];
  if (!value) throw `${variable} is not defined!`;
  else Environment[variable] = value;
};

export { AssertEnvironmentVariable, EnvironmentVariable, Environment };
