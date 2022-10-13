/* c8 ignore start */

import { Code, RequestHandler } from "../../types/http";
import { ReturnError } from "./error";
import axios from "axios";
import { Role } from "@prisma/client";
import { Environment } from "../../util/environment";
import { ComputedField } from "../../types/generic";

/**
 * Seed Controller
 * @author: Aardhyn Lavender
 * @description:  Seed the database from a `pool` with data from the applications `seed gist`
 */

const CreateSeedRequest =
  (
    model: any,
    table: string,
    access: Role[],
    unique: (string | number)[],
    computed?: ComputedField[],
    filename?: string
  ): RequestHandler =>
  async (req, res) => {
    try {
      const { role } = req.user!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

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
      const seeds: Seed[] = JSON.parse(
        data.data.files[`${filename ?? table}.json`].content
      );
      if (!seeds) throw "Seed was invalid!";

      // find seeds that already exist ( return only the unique fields )
      const duplicates: Seed[] = await model.findMany({
        where: unique.reduce(
          (predicate, field) => ({
            ...predicate,
            [field]: {
              in: seeds.map((record) => record[field]),
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
      const uniqueSeeds = seeds.filter((seed: Seed) => !IsDuplicate(seed));

      // compute values
      const computedSeeds = computed
        ? await Promise.all(
            uniqueSeeds.map(async (seed) => {
              for (const { name, compute } of computed)
                seed[name] = await compute(seed);
              return seed;
            })
          )
        : uniqueSeeds;

      // insert seeds
      await model.createMany({
        data: computedSeeds,
      });

      // response
      return res.status(Code.CREATED).json({
        msg: `${table} successfully seeded`,
        data: {
          duplicates,
          seeded: computedSeeds?.map((seed) => ({
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

/* c8 ignore end */
