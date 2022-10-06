import Prisma from "../util/prismaConfig";
import { before, after } from "mocha";
import Actor from "./actor";
import { AdminUser, SuperUser } from "./data/user";
import { SeedUser } from "./util/user";

export const ClearDatabase = async () => {
  await Prisma.user.deleteMany();
  await Prisma.quiz.deleteMany();
  await Prisma.question.deleteMany();
};

const SeedDatabase = async () => {
  await SeedUser(AdminUser);
  await SeedUser(SuperUser);
};

before((done) => {
  console.log("Pre-test: Clearing Database");
  ClearDatabase()
    .then(() => {
      SeedDatabase().then(done);
    })
    .catch(done);
});

after((done) => {
  console.log("Post-test: Clearing database");
  ClearDatabase()
    .then(() => {
      Actor.close();
      console.log("\tSuccess!");
      done();
    })
    .catch(done);
});
