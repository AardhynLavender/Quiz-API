import { Code, RequestHandler } from "../../http/http";
import { ReturnError } from "../../http/error";
import axios from "axios";
import { GetUser } from "./auth";
import { Role } from "@prisma/client";
import { Environment } from "../../util/environment";

const CreateSeedRequest =
  (
    model: any,
    table: string,
    access: Role[],
    unique: (string | number)[],
    filename?: string
  ): RequestHandler =>
  async (req, res) => {
    try {
      // Authorize the requesting user
      const user = await GetUser(req.user?.id);
      if (!user)
        return res
          .status(Code.UNAUTHORIZED)
          .json({ msg: "No user found! Have you logged in?" });

      const { role } = user;

      if (!access.includes(role))
        return res.status(Code.UNAUTHORIZED).json({
          msg: `Get outta town! ${table} can only be seeded by ${access.join(
            ","
          )}`,
        });

      // fetch seed data
      const data = await axios.get(
        `https://api.github.com/gists/${Environment.SEED_GIST_HASH}`
      );
      type Seed = Record<string, string | number | object>;
      const seed: Seed[] = JSON.parse(
        data.data.files[`${filename ?? table}.json`].content
      );
      if (!seed) throw "Seed was invalid!";

      // find seeds that already exist ( return only the unique fields )
      const duplicates: Seed[] = await model.findMany({
        where: unique.reduce(
          (predicate, field) => ({
            ...predicate,
            [field]: {
              in: seed.map((record) => record[field]),
            },
          }),
          {}
        ),
        select: unique.reduce(
          (predicate, field) => ({ ...predicate, [field]: true }),
          {}
        ),
      });

      // seed the unique seeds
      const IsDuplicate = (seed: Seed) =>
        duplicates.find((duplicate: Seed) =>
          unique.every((field) => duplicate[field] === seed[field])
        );
      const uniqueSeeds = seed.filter((seed: Seed) => !IsDuplicate(seed));
      await model.createMany({
        data: uniqueSeeds,
      });

      // response
      return res.status(Code.CREATED).json({
        msg: `${table} successfully seeded`,
        data: {
          duplicates,
          seeded: uniqueSeeds?.map((seed) => ({
            ...unique.reduce(
              (fields, field) => ({ ...fields, [field]: seed[field] }),
              {}
            ),
          })),
        },
      });
    } catch (err: any) {
      return ReturnError(err, res);
    }
  };

export default CreateSeedRequest;
