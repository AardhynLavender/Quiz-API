import Prisma from "../util/prismaConfig";
import { OpenTriviaCategory } from "../external_api/OpenTriviaDB";
import {
  GetCategories,
  GetDifficulties,
  GetTypes,
} from "../external_api/OpenTriviaDB";

export const SeedCategories = async () => {
  const categories = await GetCategories();
  const data = categories
    .map((category: OpenTriviaCategory) => ({
      name: category.name,
      categoryKey: category.id, // I need to store OpenTriviaDB's category id for filtering questions
    }))
    .concat([
      {
        name: "mixed",
        categoryKey: 0,
      },
    ]);

  const existing = await Prisma.category.count();
  if (!existing)
    await Prisma.category.createMany({
      data,
    });
  else
    console.log("There are already 'categories' in the database... skipping");
};

export const SeedDifficulties = async () => {
  const data = GetDifficulties();
  const existing = await Prisma.difficulty.count();
  if (!existing) await Prisma.difficulty.createMany({ data });
  else
    console.log("There are already 'difficulties' in the database... skipping");
};

export const SeedTypes = async () => {
  const data = GetTypes();
  const existing = await Prisma.type.count();
  if (!existing) await Prisma.type.createMany({ data });
  else console.log("There are already 'types' in the database... skipping");
};
