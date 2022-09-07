import { User } from "@prisma/client";
import Prisma from "../util/prismaConfig";
import { before, after } from "mocha";
import Actor from "./actor";

export const ClearDatabase = async () => {
  await Prisma["user"].deleteMany();
};

export const SeedUsers = async (users: User[]) => {
  await Prisma.user.createMany({
    data: users,
  });
};

export const SeedUser = async (user: User) => {
  await Prisma.user.create({
    data: user,
  });
};

before((done) => {
  ClearDatabase();
  done();
});

after((done) => {
  ClearDatabase();
  Actor.close();
  done();
});
