import { User, Quiz, Question, Answer, Result } from "@prisma/client";

interface UserSeed extends User {
  id: never;
}

interface Response {
  status: number;
  body: any;
}

interface SharedData {
  Auth: {
    Authorization: string;
  };
}

interface UserSharedData extends SharedData {
  AuthenticatedUserId?: number;
  UnauthenticatedUserId?: number;
  BasicUserId?: number | null;
  AdminUserId?: number | null;
  SuperUserId?: number | null;
}

interface SubmissionSharedData extends SharedData {
  quiz_id?: number;
  BasicUserId?: number;
  quizScore?: number;
}

interface QuizCreationSharedData {
  Auth: {
    Authorization: string;
  };
}

type JoinedQuestion = Question & { answers: Answer[] };
type JoinedQuiz = Quiz & { questions: JoinedQuestion[] };
type JoinedResult = Result & { winner: User };
