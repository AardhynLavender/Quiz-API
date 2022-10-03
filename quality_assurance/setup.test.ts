import Prisma from "../util/prismaConfig";
import { before, after } from "mocha";
import Actor from "./actor";
import { AdminUser, SuperUser } from "./data/user";
import { UserSeed } from "quality_assurance";
import { SeedUser } from "./util/user";

export const ClearDatabase = async () => {
  await Prisma.user.deleteMany();
  await Prisma.quiz.deleteMany();
};

before((done) => {
  console.log("Pre-test: Clearing Database");
  ClearDatabase()
    .then(() => {
      SeedUser(AdminUser as UserSeed)
        .then(() => {
          SeedUser(SuperUser as UserSeed)
            .then(() => {
              console.log("\tSuccess!");
              done();
            })
            .catch(done);
        })
        .catch(done);
    })
    .catch(done);
});

after((done) => {
  console.log("post-test: clearing database");
  ClearDatabase()
    .then(() => {
      Actor.close();
      console.log("\tSuccess!");
      done();
    })
    .catch(done);
});
