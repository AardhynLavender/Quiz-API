import Prisma from "../util/prismaConfig";
import { before, after } from "mocha";
import Actor from "./actor";

export const ClearDatabase = async () => {
  await Prisma["user"].deleteMany();
};

before((done) => {
  ClearDatabase().then(done).catch(done);
});

after((done) => {
  ClearDatabase().then(done).catch(done);
  Actor.close();
});
