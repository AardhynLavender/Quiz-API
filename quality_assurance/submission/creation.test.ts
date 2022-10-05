import chai from "chai";
import chaiHttp from "chai-http";
import Actor from "../actor";
import {
  AssertStandardResponse,
  AssertInvalidAuthorizationResponse,
} from "../util/assertion";
import { Code } from "../../types/http";
import Url from "../util/request";
import { RetrieveToken } from "../util/session";
import { AdminUser, BasicUser, SuperUser } from "../data/user";
import { GetUser } from "../util/user";
import { SharedData, UserSharedData } from "quality_assurance";
import AuthHeader from "../util/authorization";
import Prisma from "../../util/prismaConfig";
import {
  Answer,
  Question,
  QuestionSubmission,
  Quiz,
  Result,
  User,
} from "@prisma/client";

interface SubmissionSharedData extends SharedData {
  quiz_id?: number;
  BasicUserId?: number;
  quizScore?: number;
}

type JoinedQuestion = Question & { answers: Answer[] };
type JoinedQuiz = Quiz & { questions: JoinedQuestion[] };
type JoinedResult = Result & { winner: User };

chai.use(chaiHttp);
describe("Submission Creation", () => {
  const QUIZZES = 3;
  const SharedData: SubmissionSharedData = {
    Auth: {
      Authorization: "",
    },
  };
  before(async () => {
    // get the token we stored when authenticating
    const token = await RetrieveToken();
    SharedData.Auth = { Authorization: `Bearer ${token}` };
    SharedData.BasicUserId = (await GetUser(BasicUser.username))?.id;
  });
  it("Should retrieve all quizzes", (done) => {
    Actor.get(Url("quizzes"))
      .set(SharedData.Auth)
      .end((_, res) => {
        AssertStandardResponse(res);
        chai.expect(res.body.data).to.be.an("array");
        // .and.to.have.length(QUIZZES);

        const quiz = res.body.data[0];
        chai.expect(quiz).to.have.property("id");
        SharedData.quiz_id = quiz.id;
        done();
      });
  });
  it("Should fail to submit to a non-existent quiz", (done) => {
    Actor.post(Url("submissions"))
      .set(SharedData.Auth)
      .send({
        quiz_id: -1,
        user_id: SharedData.BasicUserId,
        rating: "INSUFFERABLE",
        question_submissions: [{ question_id: 1, answer_id: 1 }],
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        const { msg, data } = res.body;
        chai.expect(msg).to.equal("No quiz found with that id!");
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  it("Should fail to submit a non-existent user to an existing quiz", (done) => {
    Actor.post(Url("submissions"))
      .set(SharedData.Auth)
      .send({
        quiz_id: SharedData.quiz_id,
        user_id: -1,
        rating: "ONE",
        question_submissions: [
          { answer_id: 1 },
          { answer_id: 5 },
          { answer_id: 9 },
          { answer_id: 13 },
          { answer_id: 17 },
          { answer_id: 21 },
          { answer_id: 25 },
          { answer_id: 29 },
          { answer_id: 33 },
          { answer_id: 37 },
        ],
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.ERROR);
        const { msg, data } = res.body;
        chai
          .expect(msg)
          .to.contain(
            "Foreign key constraint failed on the field: `Submission_user_id_fkey (index)`"
          );
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  it("Should fail to submit less than 10 questions to an existing quiz", (done) => {
    Actor.post(Url("submissions"))
      .set(SharedData.Auth)
      .send({
        quiz_id: SharedData.quiz_id,
        user_id: SharedData.BasicUserId,
        rating: "FOUR",
        question_submissions: [
          { answer_id: 1 },
          { answer_id: 5 },
          { answer_id: 9 },
          { answer_id: 13 },
          { answer_id: 17 },
        ],
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        const { msg, data } = res.body;
        chai.expect(msg).to.equal("All `10` questions must be answered!");
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  it("should fail to submit non existent questions to an existing quiz", (done) => {
    Actor.post(Url("submissions"))
      .set(SharedData.Auth)
      .send({
        quiz_id: SharedData.quiz_id,
        user_id: SharedData.BasicUserId,
        rating: "THREE",
        question_submissions: [
          { answer_id: -1 },
          { answer_id: -5 },
          { answer_id: -9 },
          { answer_id: -13 },
          { answer_id: -17 },
          { answer_id: -21 },
          { answer_id: -25 },
          { answer_id: -29 },
          { answer_id: -33 },
          { answer_id: -37 },
        ],
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.ERROR);
        const { msg, data } = res.body;
        chai
          .expect(msg)
          .to.contain(
            "Foreign key constraint failed on the field: `QuestionSubmission_answer_id_fkey (index)`"
          );
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  it("should successfully submit valid questions to an existing quiz", (done) => {
    Actor.get(Url(`quizzes/${SharedData.quiz_id}`))
      .set(SharedData.Auth)
      .end((_, res) => {
        const { msg, data } = res.body;
        chai
          .expect(msg)
          .to.equal(`Fetched record ${SharedData.quiz_id} from Quiz`);
        chai.expect(data).to.be.an("array").and.to.have.length(1);

        // create some random answers to the quiz
        const { questions } = data[0] as JoinedQuiz;
        const answers = questions.map((q) => {
          const i = Math.floor(Math.random() * q.answers.length);
          return { answer_id: q.answers[i].id };
        });

        Actor.post(Url("submissions"))
          .set(SharedData.Auth)
          .send({
            quiz_id: SharedData.quiz_id,
            user_id: SharedData.BasicUserId,
            rating: "FIVE",
            question_submissions: answers,
          })
          .end((_, res) => {
            AssertStandardResponse(res, Code.CREATED);
            const { msg, data } = res.body;
            chai.expect(msg).to.contain("Successfully created Submission");
            chai.expect(data).to.have.property("id");

            // As scores are calculated in the OnSuccess handler, we need to re-fetch the submission to get the score
            Actor.get(Url(`submissions/${data.id}`))
              .set(SharedData.Auth)
              .end((_, res) => {
                const { data } = res.body;
                chai.expect(data).to.be.an("array").and.to.have.length(1);
                const score = data[0].score;
                chai.expect(score).to.be.a("number");
                SharedData.quizScore = score;
                done();
              });
          });
      });
  });
  it("should have a result", (done) => {
    Actor.get(Url(`results`))
      .set(SharedData.Auth)
      .end((_, res) => {
        AssertStandardResponse(res, Code.SUCCESS);
        const { msg, data } = res.body;
        chai.expect(msg).to.equal("Fetched 1 record from Result");
        chai.expect(data).to.be.an("array").and.to.have.length(1);

        const { average_score, average_rating, winner } =
          data[0] as JoinedResult;
        chai.expect(average_rating).to.equal("FIVE");
        chai.expect(average_score).to.equal(SharedData.quizScore);
        chai.expect(winner).to.have.property("first_name");
        chai.expect(winner).to.have.property("last_name");
        done();
      });
  });
});
