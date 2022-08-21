import fs from "fs";
import { Role, User } from "@prisma/client";
import Prisma from "../util/prismaConfig";
import CreateProfilePictureURI, { HashString } from "../util/profile";
import bcryptjs from "bcryptjs";

const SUCCESS = 0;
const ERROR = 1;

const GetSeedData = async (directory: string, match: RegExp) => {
  console.log(`Reading seed data from '${directory}':`);
  const children = await fs.promises.readdir(directory);
  const seedFiles = children.filter((child) => child.match(match));
  const seeds: User[] = [];

  for (const file of seedFiles) {
    const seed: User = JSON.parse(
      await fs.promises.readFile(`${directory}/${file}`, "utf8")
    );

    if (seed.role === Role.SUPER_USER) {
      console.log(` ✔️ Found '${seed.username}'`);
      const { email, username, password } = seed;

      const salt = await bcryptjs.genSalt();
      const hashedPassword = await bcryptjs.hash(password, salt);

      const profile_picture_uri = CreateProfilePictureURI(
        HashString(email + username)
      );

      seeds.push({
        ...seed,
        profile_picture_uri,
        password: hashedPassword,
      });
    } else throw ` ❌ '${seed.username}' is not a super user!`;
  }
  if (!seeds || !seeds.length) throw " ❌ No seed data found!";

  return seeds;
};

const ContainsUser = (array: User[], user: User) => {
  for (const user2 of array)
    if (user.email === user2.email || user.username === user2.username)
      return true;

  return false;
};

const FilterUnique = async (seeds: User[]) => {
  console.log("   Checking for Duplicates...");
  const emails = seeds.map((seed) => seed.email);
  const duplicates = await Prisma.user.findMany({
    where: { email: { in: emails } },
  });

  if (duplicates.length) {
    duplicates.forEach((duplicate) => {
      console.error(
        ` ❌ user ${duplicate.username} already exists in the database and cannot be reseeded!`
      );
    });
    return seeds.filter((seed) => !ContainsUser(duplicates, seed));
  } else return seeds;
};

const CreateUsers = async (seeds: User[]) => {
  console.log("   Seeding...");
  await Prisma.user.createMany({
    data: seeds,
  });
};

const SeedSuperUsers = async () => {
  const seeds = await GetSeedData("./seeding/", /^seed-\d\.json$/);
  const uniqueSeeds = await FilterUnique(seeds);
  const seedCount = uniqueSeeds.length;

  if (seedCount) {
    await CreateUsers(uniqueSeeds);
    console.log(" ✔️ Success!\n");
    console.log(
      `\n${seedCount} SUPER_USER${seedCount > 1 ? "s" : ""} successfully seeded`
    );
  } else {
    console.log("\nNo users seeded.");
  }
};

(async () => {
  try {
    await SeedSuperUsers();
    process.exit(SUCCESS);
  } catch (e) {
    console.error(e);
    process.exit(ERROR);
  }
})();
