import Prisma from "../../util/prismaConfig";
import { UserSeed } from "quality_assurance";
import { StandardHash } from "../../util/auth";

export const GetUser = async (username: string) =>
  Prisma.user.findUnique({ where: { username } });

export const SeedUsers = async (users: UserSeed[]) => {
  await Prisma.user.createMany({
    data: users,
  });
};

export const SeedUser = async (user: UserSeed) => {
  const password = await StandardHash(user.password);
  await Prisma.user.create({
    data: {
      ...user,
      password,
    },
  });
};
