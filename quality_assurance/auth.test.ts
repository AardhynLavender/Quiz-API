import Actor from "./actor";
import { SuperAdmin, UnauthenticatedUser, UnregisteredUser } from "./data/user";
import Url from "./util/request";
import chai from "chai";
import chaiHttp from "chai-http";
import { Code } from "../types/http";

import { RetrieveToken, StoreToken } from "./util/session";
import { AssertStandardSuccess, AssertStandardError } from "./util/assertion";
chai.use(chaiHttp);

describe("Authentication", () => {
  const messages = {
    NON_EXISTENT_USER: "A user is not registered with these credentials",
    INVALID_PASSWORD: "Invalid password/username",
  };
  const login = Url("auth/login");
  it("should fail authentication with non-existent user", (done) => {
    Actor.post(login)
      .send(UnregisteredUser)
      .end((err, res) => {
        AssertStandardError(res, Code.NOTFOUND);
        chai.expect(res.body.msg).to.equal(messages.NON_EXISTENT_USER);
        done();
      });
  });
  it("should fail authentication with invalid password", (done) => {
    Actor.post(login)
      .send(UnauthenticatedUser)
      .end((err, res) => {
        AssertStandardError(res, Code.UNAUTHORIZED);
        chai.expect(res.body.msg).to.equal(messages.INVALID_PASSWORD);

        done();
      });
  });
  it("Should login with valid credentials", (done) => {
    Actor.post(login)
      .send(SuperAdmin)
      .end((error, res) => {
        const { body } = res;
        AssertStandardSuccess(res);
        chai.expect(body).to.have.property("token");
        chai
          .expect(body.msg)
          .to.equal(`${SuperAdmin.username} has been logged in`);

        StoreToken(body.token);
        done();
      });
  });
  it("should access the token", (done) => {
    RetrieveToken().then((token) => {
      chai.expect(token).to.be.a("string");
      done();
    });
  });
});
