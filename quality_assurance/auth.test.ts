import Actor from "./actor";
import { UnauthenticatedUser, UnregisteredUser, BasicUser } from "./data/user";
import Url from "./util/request";
import chai from "chai";
import chaiHttp from "chai-http";
import { Code } from "../types/http";

import { RetrieveToken, StoreToken } from "./util/session";
import {
  AssertInvalidAuthorizationResponse,
  AssertStandardResponse,
} from "./util/assertion";
chai.use(chaiHttp);

const login = Url("auth/login");
const ShouldLogin = (assertion: string) =>
  it(assertion, (done) => {
    Actor.post(login)
      .send(BasicUser)
      .end((_, res) => {
        const { body } = res;
        AssertStandardResponse(res);
        chai.expect(body).to.have.property("token");
        chai
          .expect(body.msg)
          .to.equal(`${BasicUser.username} has been logged in`);
        StoreToken(body.token);
        done();
      });
  });

describe("Authentication", () => {
  const messages = {
    NON_EXISTENT_USER: "A user is not registered with these credentials",
    INVALID_PASSWORD: "Invalid password/username",
  };
  it("should fail authentication with non-existent user", (done) => {
    Actor.post(login)
      .send(UnregisteredUser)
      .end((_, res) => {
        AssertStandardResponse(res, Code.NOTFOUND);
        chai.expect(res.body.msg).to.equal(messages.NON_EXISTENT_USER);
        done();
      });
  });
  it("should fail authentication with invalid password", (done) => {
    Actor.post(login)
      .send(UnauthenticatedUser)
      .end((_, res) => {
        AssertStandardResponse(res, Code.UNAUTHORIZED);
        chai.expect(res.body.msg).to.equal(messages.INVALID_PASSWORD);
        done();
      });
  });
  ShouldLogin("Should login with valid credentials");
  it("Should retrieve the token", (done) => {
    RetrieveToken()
      .then((token) => {
        chai.expect(token).to.be.a("string");
        done();
      })
      .catch(done);
  });
  it("Should logout", (done) => {
    RetrieveToken()
      .then((token) => {
        chai.expect(token).to.be.a("string");
        const logout = Url("auth/logout");
        Actor.get(logout)
          .set({ Authorization: `Bearer ${token}` })
          .end((_, res) => {
            AssertStandardResponse(res);
            chai
              .expect(res.body.msg)
              .to.equal(`${BasicUser.username} successfully logged out`);
            done();
          });
      })
      .catch(done);
  });
  it("Should be unable to access authenticated routes", (done) => {
    Actor.get(Url(`users`)).end((_, res) => {
      AssertInvalidAuthorizationResponse(res);
      chai.expect(res.body.data).to.be.undefined;
      done();
    });
  });
  ShouldLogin("Should be able to login again");
});
