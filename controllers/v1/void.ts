import { Code, RequestHandler } from "../../types/http";
import { Crud } from "../../types/crud";

const CreateVoidRoute =
  (operation: Crud | string, table: string): RequestHandler =>
  async (_, res) => {
    return res.status(Code.NOTFOUND).json({
      msg: `No Handler is available for ${table} ${operation}`,
    });
  };

export default CreateVoidRoute;
