import Prisma from "../../util/prismaConfig";
import CrudInterface from "../../types/generic";
import { Rating, Role, Submission } from "@prisma/client";
import CreateRouter from "./generic";
import { QUESTIONS } from "./quiz";
import { Pluralize } from "../../util/string";

/**
 * Submission Interface
 * @author Aardhyn Lavender
 *
 * @description   Allows Users to submit answers to a quiz
 *
 *                Each submission is marked after submission.
 *                The related `Result` is upserted.
 *
 *                SUPER_USERs and ADMIN_USERs can update. SUPER_USERs can delete
 *
 *                BASIC_USERs can read their own submissions
 */

const RatingLegend: Record<Rating, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

const CreateResult = async (submission: Submission) => {
  // get answers from submission

  const quiz = await Prisma.quiz.findUnique({
    where: { id: submission.quiz_id },
  });
  if (!quiz) throw new Error(`Quiz '${submission.quiz_id}' not found`);

  const answers = await Prisma.questionSubmission.findMany({
    where: { submission_id: submission.id },
    include: {
      answer: {
        select: {
          correct: true,
        },
      },
    },
  });

  // Mark quiz and add score

  const correct = answers.filter((a) => a.answer.correct).length;
  await Prisma.submission.update({
    where: { id: submission.id },
    data: {
      score: correct,
    },
  });
  const submissions = await Prisma.submission.findMany({
    where: { quiz_id: quiz.id },
  });

  // Recompute averages

  const average_score =
    submissions.reduce((a, b) => a + b.score, 0) / submissions.length;

  const average_rating_int =
    submissions.reduce((a, b) => a + RatingLegend[b.rating], 0) /
    submissions.length;

  const average_rating = Object.keys(RatingLegend).find(
    (key) => RatingLegend[key as Rating] === Math.round(average_rating_int)
  ) as Rating;

  // determine winner

  const result = await Prisma.result.findUnique({
    where: { quiz_id: quiz.id },
  });
  const winner_id =
    result?.winner_id ??
    submissions.sort((a, b) => a.score - b.score)[0].user_id;

  // Upsert result for associated quiz

  await Prisma.result.upsert({
    where: { quiz_id: quiz.id },
    create: {
      quiz_id: quiz.id,
      average_score,
      average_rating,
      winner_id,
    },
    update: {
      average_score,
      average_rating,
      winner_id,
    },
  });
};

const submission: CrudInterface<Submission> = {
  name: "Submission",
  model: Prisma.submission,
  schema: ["quiz_id", "user_id", "rating"],
  unique: ["quiz_id", "user_id"],
  relations: {
    question_submissions: { select: { answer: { select: { text: true } } } },
  },
  validated: [
    {
      validator: async ({ quiz_id }) => {
        try {
          const quiz = await Prisma.quiz.findUnique({
            where: { id: quiz_id },
          });
          return quiz !== null;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
      message: "No quiz found with that id!",
    },
    {
      validator: async ({ quiz_id }) => {
        const quiz = await Prisma.quiz.findUnique({
          where: { id: quiz_id },
        });
        if (!quiz) return false;

        const { start_date, end_date } = quiz;
        const current_date = new Date();
        return current_date >= start_date && current_date <= end_date;
      },
      message: "Quiz is not available for participation!",
    },
    {
      validator: async ({ question_submissions }) =>
        question_submissions &&
        question_submissions.create.length === QUESTIONS,
      message: `All \`${QUESTIONS}\` ${Pluralize(
        "question",
        QUESTIONS
      )} must be answered!`,
    },
  ],
  nestedWriteSchema: ["question_submissions"],
  accessPragma: {
    create: [Role.BASIC_USER, Role.ADMIN_USER, Role.SUPER_USER],
    read: {
      unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER],
      conditionalAccess: (data, user) =>
        data.user_id === user.id
          ? { success: true, message: "ok" }
          : {
              success: false,
              message: "You may not access the quiz submissions of other users",
            },
    },
    readMany: [Role.SUPER_USER, Role.ADMIN_USER, Role.BASIC_USER],
    update: { unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER] },
    delete: { unconditionalAccess: [Role.SUPER_USER] },
  },
  onCreateSuccess: CreateResult,
};

export default CreateRouter(submission);
