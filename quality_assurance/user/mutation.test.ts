import chai from "chai";
import chaiHttp from "chai-http";
import { GetUser } from "../util/user";
import { UserSharedData } from "../.";
import { BasicUser, AdminUser, SuperUser } from "../data/user";
import { RetrieveToken } from "../util/session";
import { Code } from "../../types/http";
import Actor from "../actor";
import { AssertStandardResponse } from "../util/assertion";
import Url from "../util/request";
import { Role, User } from "@prisma/client";

chai.use(chaiHttp);
describe("User Mutation", () => {
  const ONE_USER = 1;
  const FIRST = 0;
  const STAR = "*";
  const SharedData: UserSharedData = {
    Auth: {
      Authorization: "",
    },
  };
  before(async () => {
    const token = await RetrieveToken();
    SharedData.Auth = { Authorization: `Bearer ${token}` };
    // eslint-disable-next-line no-extra-parens
    const { id: basic } = (await GetUser(BasicUser.username)) ?? {
      id: undefined,
    };
    chai.expect(basic).to.not.be.undefined;
    SharedData.AuthenticatedUserId = SharedData.BasicUserId = basic;

    // eslint-disable-next-line no-extra-parens
    const { id: admin } = (await GetUser(AdminUser.username)) ?? {
      id: undefined,
    };
    chai.expect(admin).to.not.be.undefined;
    SharedData.UnauthenticatedUserId = admin;
  });
  it("Should fail to mutate a non-authenticated user", (done) => {
    Actor.put(Url(`users/${SharedData.UnauthenticatedUserId}`))
      .set(SharedData.Auth)
      .send({
        first_name: "y0uv3 b33n hack3d!",
      })
      .end((_, res) => {
        AssertStandardResponse(res, Code.UNAUTHORIZED);
        const { msg, data } = res.body;
        chai
          .expect(msg)
          .to.be.equal(
            `A ${BasicUser.role} can only modify his own data! Try PUT api/users/${SharedData.AuthenticatedUserId}/`
          );
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  it("Should mutate the authenticated user", (done) => {
    const mutation = {
      email: "mmann@hey.com",
    };
    Actor.put(Url(`users/${SharedData.AuthenticatedUserId}`))
      .set(SharedData.Auth)
      .send(mutation as User)
      .end((_, res) => {
        AssertStandardResponse(res, Code.SUCCESS);
        const { msg, data } = res.body;
        chai
          .expect(msg)
          .to.be.equal(
            `User with the id: ${SharedData.AuthenticatedUserId} successfully updated`
          );
        chai.expect(data).to.be.an("array");
        chai.expect(data).to.have.lengthOf(ONE_USER);
        const { id, password, email } = data[FIRST];
        chai.expect(id).to.be.equal(SharedData.AuthenticatedUserId); // we have mutated an existing user
        chai.expect(email).to.be.equal(mutation.email); // mutation was successful
        chai.expect(password).to.equal(STAR.repeat(password.length)); // we are returning a masked password
        done();
      });
  });
  it("Should fail to mutate immutable fields", (done) => {
    const mutation = {
      role: "SUPER_USER",
    };
    Actor.put(Url(`users/${SharedData.AuthenticatedUserId}`))
      .set(SharedData.Auth)
      .send(mutation as User)
      .end((_, res) => {
        AssertStandardResponse(res, Code.BAD_REQUEST);
        const { msg, data } = res.body;
        chai
          .expect(msg)
          .to.be.equal(
            `Whoops! The following fields are immutable: ${
              Object.keys(mutation).join(", ") ?? ""
            }`
          );
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  for (const user of [AdminUser, SuperUser]) {
    it(`Should login as ${
      user.role === Role.ADMIN_USER ? "an ADMIN_USER" : "a SUPER_USER"
    }`, (done) => {
      Actor.post(Url("auth/login"))
        .send({
          username: user.username,
          password: user.password,
        })
        .end((_, res) => {
          AssertStandardResponse(res, Code.SUCCESS);
          const { msg, token } = res.body;
          chai.expect(msg).to.be.equal(`${user.username} has been logged in`);
          // update token
          chai.expect(token).to.be.a("string");
          SharedData.Auth.Authorization = `Bearer ${token}`;
          SharedData.UnauthenticatedUserId = SharedData.AuthenticatedUserId;
          GetUser(user.username)
            .then((user) => {
              chai.expect(user).to.not.be.null;
              // admin user is now authenticated
              SharedData.AuthenticatedUserId = user?.id;
              done();
            })
            .catch(done);
        });
    });
    it(`${user.role} can mutate an unauthenticated user`, (done) => {
      const mutation = {
        email: "mmann@fast-mail.org",
      };
      Actor.put(Url(`users/${SharedData.BasicUserId}`))
        .set(SharedData.Auth)
        .send(mutation as User)
        .end((_, res) => {
          AssertStandardResponse(res, Code.SUCCESS);
          const { msg, data } = res.body;
          chai
            .expect(msg)
            .to.be.equal(
              `User with the id: ${SharedData.BasicUserId} successfully updated`
            );
          const { email } = data[FIRST];
          chai.expect(email).to.be.equal(mutation.email); // mutation was successful
          done();
        });
    });
  }
});
