import Prisma from "../util/prismaConfig";
import { before, after } from "mocha";
import Actor from "./actor";
import { AdminUser, SuperUser } from "./data/user";
import { UserSeed } from "quality_assurance";
import { SeedUser } from "./util/user";

export const ClearDatabase = async () => {
  await Prisma["user"].deleteMany();
};

before((done) => {
  ClearDatabase()
    .then(() => {
      SeedUser(AdminUser as UserSeed)
        .then(() => {
          SeedUser(SuperUser as UserSeed)
            .then(done)
            .catch(done);
        })
        .catch(done);
    })
    .catch(done);
});

after((done) => {
  ClearDatabase()
    .then(() => {
      Actor.close();
      done();
    })
    .catch(done);
});
