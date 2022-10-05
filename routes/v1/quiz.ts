import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";
import CrudInterface from "../../types/generic";
import { Quiz, Role } from "@prisma/client";
import { GetQuestions } from "../../external_api/OpenTriviaDB";
import { ValidatedField } from "../../types/generic";

const CreateQuestions = async ({
  id: quiz_id,
  category_type,
  difficulty_type,
  question_type,
  question_count,
}: Quiz) => {
  if (
    difficulty_type !== "mixed" &&
    !["easy", "medium", "hard"].includes(difficulty_type)
  )
    throw new Error(`Invalid difficulty type: '${difficulty_type}'`);

  if (
    category_type !== "mixed" &&
    !["multiple", "boolean"].includes(question_type)
  )
    throw new Error(`Invalid question type: '${question_type}'`);

  // create questions for the quiz
  const questions = await GetQuestions(
    question_count,
    category_type,
    difficulty_type as any,
    question_type as any
  );

  for (const q of questions) {
    const {
      question,
      category,
      type,
      difficulty,
      correct_answer,
      incorrect_answers,
    } = q;

    await Prisma.question.create({
      data: {
        question,
        quiz_id,
        difficulty_type: difficulty,
        category_type: category,
        question_type: type,
        answers: {
          create: [
            ...incorrect_answers.map((answer) => ({
              text: answer,
              correct: false,
            })),
            {
              text: correct_answer,
              correct: true,
            },
          ],
        },
      },
    });
  }
};

export const QUESTIONS = 10;
const MAX_QUIZ_LENGTH = 5;
const NAME_MIN_LENGTH = 5;
const NAME_MAX_LENGTH = 30;

const DifferenceInDays = (date1: Date, date2: Date) => {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
};

const quizValidators: ValidatedField<Quiz>[] = [
  {
    validator: ({ name }) => {
      const { length } = name as string;
      return (
        typeof name === "string" &&
        length >= NAME_MIN_LENGTH &&
        length <= NAME_MAX_LENGTH
      );
    },
    message: `\`Name\` must be between \`${NAME_MIN_LENGTH}\` and \`${NAME_MAX_LENGTH}\` characters inclusive`,
  },
  {
    validator: ({ start_date }) => {
      const date = new Date(start_date);
      const current = new Date();
      current.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return date >= current;
    },
    message: "`Start Date` must be in the future",
  },
  {
    validator: ({ end_date, start_date }) => {
      const endDate = new Date(end_date);
      const startDate = new Date(start_date);
      return startDate < endDate;
    },
    message: "A quiz cannot end before it starts",
  },
  {
    validator: ({ start_date, end_date }) => {
      const endDate = new Date(end_date);
      const startDate = new Date(start_date);
      return DifferenceInDays(startDate, endDate) <= MAX_QUIZ_LENGTH;
    },
    message: `Quiz length must not exceed \`${MAX_QUIZ_LENGTH}\` days`,
  },
  {
    validator: ({ question_count }) =>
      !question_count || question_count === QUESTIONS,
    message: `A quiz must have \`${QUESTIONS}\` questions`,
  },
];

const quiz: CrudInterface<Quiz> = {
  name: "Quiz",
  model: Prisma.quiz,
  schema: [
    "name",
    "start_date",
    "end_date",
    "category_type",
    "difficulty_type",
    "question_type",
    "question_count",
  ],
  relations: {
    questions: {
      select: {
        id: true,
        question: true,
        answers: {
          select: {
            id: true,
            text: true,
          },
        },
      },
    },
  },
  validated: quizValidators,
  unique: ["name"],
  accessPragma: {
    create: [Role.ADMIN_USER, Role.SUPER_USER],
    read: { unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER] },
    readMany: [Role.SUPER_USER, Role.ADMIN_USER, Role.BASIC_USER],
    update: { unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER] },
    delete: { unconditionalAccess: [Role.SUPER_USER] },
  },
  onCreateSuccess: CreateQuestions,
};

export default CreateRouter(quiz);
