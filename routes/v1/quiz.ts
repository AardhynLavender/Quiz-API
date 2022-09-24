import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";
import CrudInterface from "../../types/generic";
import { Quiz, Role } from "@prisma/client";
import { GetQuestions } from "../../external_api/OpenTriviaDB";

const user: CrudInterface<Quiz> = {
  name: "Quiz",
  model: Prisma.quiz,
  schema: ["name", "start_date", "end_date", "category", "difficulty", "type"],
  unique: ["name"],
  accessPragma: {
    create: [Role.ADMIN_USER, Role.SUPER_USER],
    read: { unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER] },
    readMany: [Role.SUPER_USER, Role.ADMIN_USER, Role.BASIC_USER],
    update: { unconditionalAccess: [Role.SUPER_USER, Role.ADMIN_USER] },
    delete: { unconditionalAccess: [Role.SUPER_USER] },
  },
  onCreateSuccess: async (data: Quiz) => {
    const { category_type, difficulty_type, question_type } = data;
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
      data.category_type,
      data.difficulty_type as any,
      data.question_type as any
    );

    if (!questions) throw new Error("Could not create questions for quiz!");

    for (const q of questions) {
      const {
        question: name,
        category,
        type,
        difficulty,
        correct_answer,
        incorrect_answers,
      } = q;

      await Prisma.question.create({
        data: {
          question: name,
          quiz_id: data.id,
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
  },
};

export default CreateRouter(user);
