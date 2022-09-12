import Actor from "../actor";
import { BasicUser } from "../data/user";
import Url from "../util/request";
import chai from "chai";
import chaiHttp from "chai-http";
import { Code } from "../../types/http";
import { AssertStandardResponse } from "../util/assertion";
import { Role } from ".prisma/client";
import { ToQuietSnakeCase } from "../../util/string";

chai.use(chaiHttp);

describe("Registration", () => {
  const messages = {
    REGISTRATION_SUCCESS: "User successfully registered",
    USER_EXISTS: "User already exists",
  };
  const STAR = "*";
  const register = Url("auth/register");
  for (const field of [
    "First Name",
    "Last Name",
    "Email",
    "Password",
    "Confirm Password",
  ])
    it(`Should fail to register a user with no ${field}`, (done) => {
      Actor.post(register)
        .send({ ...BasicUser, [ToQuietSnakeCase(field)]: undefined })
        .end((_, res) => {
          AssertStandardResponse(res, Code.BAD_REQUEST);
          chai.expect(res.body.msg).to.equal(`${field} must not be empty`);
          done();
        });
    });
  it("Should register a basic user with valid credentials", (done) => {
    Actor.post(register)
      .send(BasicUser)
      .end((_, res) => {
        AssertStandardResponse(res, Code.CREATED);
        const { msg, data } = res.body;
        const { password, role } = data;
        chai.expect(msg).to.equal(messages.REGISTRATION_SUCCESS);
        chai.expect(password).to.contain(STAR);
        chai.expect(role).to.equal(Role.BASIC_USER);
        done();
      });
  });
  it("Should fail to register the same user twice", (done) => {
    Actor.post(register)
      .send(BasicUser)
      .end((_, res) => {
        AssertStandardResponse(res, Code.CONFLICT);
        const { msg, data } = res.body;
        chai.expect(msg).to.equal(messages.USER_EXISTS);
        chai.expect(data).to.be.undefined;
        done();
      });
  });
});
