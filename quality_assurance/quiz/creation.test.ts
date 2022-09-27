import chai from "chai";
import chaiHttp from "chai-http";
import { BasicUser, AdminUser, SuperUser } from "../data/user";
import { RetrieveToken } from "../util/session";
import { Code } from "../../types/http";
import Actor from "../actor";
import {
  AssertStandardResponse,
  AssertInvalidAuthorizationResponse,
} from "../util/assertion";
import Url from "../util/request";
import { Role, Category } from "@prisma/client";

interface QuizCreationSharedData {
  Auth: {
    Authorization: string;
  };
}

chai.use(chaiHttp);
describe("Quiz Creation", () => {
  const ONE_DAY = 1;
  const QUIZ_CREATION_SUCCESS = "Successfully created Quiz";
  const CreateDateSet = (start_date = new Date(), difference = ONE_DAY) => {
    const end_date = new Date(start_date.getTime());
    end_date.setDate(start_date.getDate() + difference);
    return [start_date, end_date];
  };
  const SharedData: QuizCreationSharedData = {
    Auth: {
      Authorization: "",
    },
  };
  it("Fails to create a quiz while unauthorized", (done) => {
    Actor.post(Url("quizzes"))
      .send({
        plzExecute: "'; DROP TABLE quizzes; --",
      })
      .end((_, res) => {
        AssertInvalidAuthorizationResponse(res);
        done();
      });
  });
  for (const user of [BasicUser, AdminUser, SuperUser])
    it(`${user.role} is ${
      user.role === Role.BASIC_USER ? "unable" : "able"
    } to create a quiz`, (done) => {
      Actor.post(Url("auth/login"))
        .send(user)
        .end((_, res) => {
          SharedData.Auth = { Authorization: `Bearer ${res.body.token}` };
          const [start_date, end_date] = CreateDateSet();
          // done();
          Actor.post(Url("quizzes"))
            .set(SharedData.Auth)
            .send({
              name: `${user.first_name}'s Quiz`,
              start_date,
              end_date,
            })
            .end((_, res) => {
              if (user.role === Role.BASIC_USER) {
                AssertStandardResponse(res, Code.FORBIDDEN);
              } else {
                AssertStandardResponse(res, Code.CREATED);
                const { msg, data } = res.body;
                chai.expect(msg).to.equal(QUIZ_CREATION_SUCCESS);
                chai.expect(data.id).to.be.a("number");
                chai.expect(data.name).to.equal(`${user.first_name}'s Quiz`);
                for (const key of ["difficulty", "question", "category"])
                  chai.expect(data[`${key}_type`]).to.equal("mixed");
              }
              done();
            });
        });
    });
  for (const [invalidQuizName, adjective] of [
    ["quiz", "short"],
    ["supercalifragilisticexpialidocious", "long"],
  ])
    it(`Fails to create a quiz with too ${adjective} a name`, (done) => {
      const [start_date, end_date] = CreateDateSet();
      Actor.post(Url("quizzes"))
        .set(SharedData.Auth)
        .send({
          name: invalidQuizName,
          start_date,
          end_date,
        })
        .end((_, res) => {
          AssertStandardResponse(res, Code.BAD_REQUEST);
          chai
            .expect(res.body.msg)
            .to.equal(
              "`Name` must be between `5` and `30` characters inclusive"
            );
          done();
        });
    });
  it("Fails to create a quiz with a title including non-alphanumeric characters", (done) => {
    const [start_date, end_date] = CreateDateSet();
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s 2nd Quiz`,
        start_date,
        end_date,
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        chai
          .expect(res.body.msg)
          .to.equal(`Name must only contain alphanumeric characters`);
        done();
      });
  });
  it("Fails to create a quiz with the same name", (done) => {
    const [start_date, end_date] = CreateDateSet();
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s Quiz`,
        start_date,
        end_date,
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.ERROR);
        chai
          .expect(res.body.msg)
          .to.include("Unique constraint failed on the fields: (`name`)");
        done();
      });
  });
  it("Fails to create a quiz starting in the past", (done) => {
    const [start_date, end_date] = CreateDateSet(new Date("1970-01-01"));
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s Second Quiz`,
        start_date,
        end_date,
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        chai
          .expect(res.body.msg)
          .to.equal("`Start Date` must be in the future");
        done();
      });
  });
  it("Fails to create a quiz finishing before starting", (done) => {
    const [end_date, start_date] = CreateDateSet(); // <-- note: the object destructor is reversed
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s Third Quiz`,
        start_date,
        end_date,
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        chai
          .expect(res.body.msg)
          .to.equal("A quiz cannot end before it starts");
        done();
      });
  });
  it("Fails to create a quiz longer than 5 days", (done) => {
    const [start_date, end_date] = CreateDateSet(new Date(), 20);
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s Fourth Quiz`,
        start_date,
        end_date,
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        chai
          .expect(res.body.msg)
          .to.equal("Quiz length must not exceed 5 days");
        done();
      });
  });
  it("Fails to create a quiz with more than 10 questions", (done) => {
    const [start_date, end_date] = CreateDateSet();
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s Fifth Quiz`,
        start_date,
        end_date,
        amount: 11,
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        chai
          .expect(res.body.msg)
          .to.equal("A quiz must have less than 11 questions");
        done();
      });
  });
  it("Fails to create a quiz with less than 10 questions", (done) => {
    const [start_date, end_date] = CreateDateSet();
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s Sixth Quiz`,
        start_date,
        end_date,
        amount: 9,
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        chai
          .expect(res.body.msg)
          .to.equal("A quiz must have more than 9 questions");
        done();
      });
  });
  it("Fails to create a quiz with an invalid difficulty", (done) => {
    const [start_date, end_date] = CreateDateSet();
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s seventh Quiz`,
        start_date,
        end_date,
        difficulty_type: "I'm to young to die!",
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.ERROR);
        chai
          .expect(res.body.msg)
          .to.include(
            `Foreign key constraint failed on the field: \`Quiz_difficulty_type_fkey (index)\``
          );
        done();
      });
  });

  it("Fails to create a quiz with an invalid category", (done) => {
    const [start_date, end_date] = CreateDateSet();
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s Eighth Quiz`,
        start_date,
        end_date,
        category_type: "advanced quantum physics",
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.ERROR);
        chai
          .expect(res.body.msg)
          .to.include(
            `Foreign key constraint failed on the field: \`Quiz_category_type_fkey (index)\``
          );
        done();
      });
  });
  it("Fails to create a quiz with an invalid question type", (done) => {
    const [start_date, end_date] = CreateDateSet();
    Actor.post(Url("quizzes"))
      .set(SharedData.Auth)
      .send({
        name: `${SuperUser.first_name}'s Ninth Quiz`,
        start_date,
        end_date,
        question_type: "matrix",
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.ERROR);
        chai
          .expect(res.body.msg)
          .to.include(
            `Foreign key constraint failed on the field: \`Quiz_question_type_fkey (index)\``
          );
        done();
      });
  });
});
