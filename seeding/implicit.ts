import Prisma from "../util/prismaConfig";
import { OpenTriviaCategory } from "../external_api/OpenTriviaDB";
import {
  GetCategories,
  GetDifficulties,
  GetTypes,
} from "../external_api/OpenTriviaDB";
import { Category } from "@prisma/client";

/**
 * @author Aardhyn Lavender 2022
 * @description Seed the categories, difficulties, and question types, with the categories from Open Trivia DB
 */

const SelectNames = (categories: OpenTriviaCategory[]): Category[] =>
  categories.map((category) => ({ name: category.name }));

export const SeedCategories = async () => {
  const categories = await GetCategories();
  const existing = await Prisma.category.count();
  if (!existing)
    await Prisma.category.createMany({
      data: SelectNames(categories),
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
