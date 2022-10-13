import { Code, RequestHandler } from "../../types/http";
import { Crud } from "../../types/crud";

/**
 * void Route
 * @author: Aardhyn Lavender
 * @description:  Void route specifies no handler for a known route.
 *                Such as a GET on a CRUD Interface that does not allow READ operations.
 *
 *                For unknown arbitrary routes, use the `DefaultRoute` router instead.
 */

const CreateVoidRoute =
  (operation: Crud | string, table: string): RequestHandler =>
  async (_, res) => {
    return res.status(Code.NOTFOUND).json({
      msg: `No Handler is available for ${table} ${operation}`,
    });
  };

export default CreateVoidRoute;
