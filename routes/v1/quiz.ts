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
    10,
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

const DifferenceInDays = (date1: Date, date2: Date) => {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
};

const quizValidators: ValidatedField<Quiz>[] = [
  {
    validator: ({ name }) => {
      const { length } = name as string;
      return typeof name === "string" && length > 4 && length < 31;
    },
    message: "`Name` must be between `5` and `30` characters inclusive",
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
      return DifferenceInDays(startDate, endDate) <= 5;
    },
    message: "Quiz length must not exceed 5 days",
  },
];

const user: CrudInterface<Quiz> = {
  name: "Quiz",
  model: Prisma.quiz,
  schema: [
    "name",
    "start_date",
    "end_date",
    "category_type",
    "difficulty_type",
    "question_type",
  ],
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

export default CreateRouter(user);
