import { Category, Difficulty } from "@prisma/client";
import Prisma from "../util/prismaConfig";
import axios from "axios";

//
// Open Trivia DB API Type Definitions and queries
// https://opentdb.com/
//

export type Type = "multiple" | "boolean";
export type Mixed = "mixed";
export type OpenTriviaDifficulty = "easy" | "medium" | "hard";

export interface OpenTriviaQuestion {
  question: string;
  category: string;
  type: Type;
  difficulty: OpenTriviaDifficulty;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface OpenTriviaQuestionsResponse {
  response_code: number;
  results: OpenTriviaQuestion[];
}

export interface OpenTriviaCategory extends Category {
  id: number;
}

export interface OpenTriviaCategoriesResponse {
  trivia_categories: OpenTriviaCategory[];
}

export interface OpenTriviaQuestionType {
  name: Type | Mixed;
}

export const HandleOpenTriviaResponseCode = (code: number) => {
  switch (code) {
    case 0:
      return; // success
    case 1:
      throw new Error("No Results could be found for the provided query!");
    case 2:
      throw new Error("An invalid parameter was supplied!");
    case 3:
      throw new Error("Token not found!");
    case 4:
      throw new Error(
        "Available questions have been exhausted. Token reset required!"
      );
    default:
      throw new Error(
        `Unknown error! ${code} is not a known response code, has the OpenTriviaDB API been updated?`
      );
  }
};

export const GetQuestions = async (
  amount: number,
  category: Mixed | string,
  difficulty: Mixed | "easy" | "medium" | "hard",
  type: Mixed | Type
): Promise<OpenTriviaQuestion[]> => {
  const categoryKey = category
    ? (
        await Prisma.category.findUnique({
          where: { name: category },
        })
      )?.categoryKey
    : undefined;

  if (categoryKey === null)
    throw new Error(`Could not find provided category: '${category}'!`);

  const queries = [
    amount ? `amount=${amount}` : "",
    categoryKey ? `category=${categoryKey}` : "",
    difficulty && difficulty !== "mixed" ? `difficulty=${difficulty}` : "",
    type && type != "mixed" ? `type=${type}` : "",
  ].join("&");
  const response = await axios.get<OpenTriviaQuestionsResponse>(
    `https://opentdb.com/api.php?${queries}`
  );

  const { response_code, results } = response.data;
  HandleOpenTriviaResponseCode(response_code);
  return results;
};

export const GetCategories = async () => {
  const response = await axios.get<OpenTriviaCategoriesResponse>(
    `https://opentdb.com/api_category.php`
  );
  return response.data.trivia_categories;
};

export const GetDifficulties = (): Difficulty[] => [
  { name: "easy" },
  { name: "medium" },
  { name: "hard" },
  { name: "mixed" },
];

export const GetTypes = (): OpenTriviaQuestionType[] => {
  return ["mixed", "multiple", "boolean"].map((type) => ({
    name: type as Type,
  }));
};
