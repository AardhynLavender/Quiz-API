const ERROR_CHAR = "❌";
const SUCCESS_CHAR = "✔️";
const CreateLog = (message: string, error = false) =>
  ` ${error ? ERROR_CHAR : SUCCESS_CHAR} ${message}`;

const Stdout = (message: string, error = false) =>
  console.log(CreateLog(message, error));

export { Stdout, CreateLog, ERROR_CHAR, SUCCESS_CHAR };
