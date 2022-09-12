import Prisma from "../../util/prismaConfig";
import { UserSeed } from "quality_assurance";

export const GetUser = async (username: string) =>
  Prisma.user.findUnique({ where: { username } });

export const SeedUsers = async (users: UserSeed[]) => {
  await Prisma.user.createMany({
    data: users,
  });
};

export const SeedUser = async (user: UserSeed) => {
  await Prisma.user.create({
    data: user,
  });
};
