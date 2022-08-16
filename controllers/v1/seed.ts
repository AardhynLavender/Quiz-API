import { Code, RequestHandler } from "../../http/http";
import { ReturnError } from "../../http/error";
import axios from "axios";

interface Seed {
  [data: string]: {
    id?: number;
  };
}

const CreateSeedRequest =
  (
    model: any,
    table: string,
    seedGistHash: string,
    gitHubUsername: string,
    filename?: string
  ): RequestHandler =>
  async (req, res) => {
    try {
      const data = await axios.get(
        `https://gist.github.com/${gitHubUsername}/${seedGistHash}`
      );
      const seed: Seed = JSON.parse(
        data.data.files[filename ?? `${table}s.json`].content
      );
      if (!seed) throw "Seed was invalid!";
      /**@depreciated
      const existing = await model.findUnique({
        where: { id: 1 },
      });
      if (existing)
        return res.status(Code.SUCCESS).json({
          msg: `${table} already seeded!`,
          data: existing,
        });
      else {
        */

      // Assumes seed data can be parsed by Prima.
      await model.create({
        ...seed,
      });

      const mutated = await model.findMany();
      return res.status(Code.CREATED).json({
        msg: `${table} successfully seeded`,
        data: mutated,
      });
      // }
    } catch (err: any) {
      return ReturnError(err, res);
    }
  };

export default CreateSeedRequest;
