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
import { UserSharedData } from "quality_assurance";
import AuthHeader from "../util/authorization";

chai.use(chaiHttp);
describe("User Deletion", () => {
  const Message = {
    DELETE_ELEVATION_ERR:
      "You do not have permission to delete this records from User",
    IMMORTAL_USER_DELETION_ERR:
      "Although you are powerful, you are not *all* powerful! SUPER_USERS may not be deleted",
  };
  const SharedData: UserSharedData = {
    Auth: {
      Authorization: "",
    },
  };
  before(async () => {
    // get the token we stored when authenticating
    const token = await RetrieveToken();
    SharedData.Auth = { Authorization: `Bearer ${token}` };
    SharedData.BasicUserId = (await GetUser(BasicUser.username))?.id;
    SharedData.AdminUserId = (await GetUser(AdminUser.username))?.id;
    SharedData.SuperUserId = (await GetUser(SuperUser.username))?.id;
  });
  it("Unauthenticated user is unable to delete a user", (done) => {
    Actor.delete(Url(`users/${SharedData.BasicUserId}`)).end((_, res) => {
      AssertInvalidAuthorizationResponse(res);
      chai.expect(res.body.data).to.be.undefined;
      done();
    });
  });
  it("BASIC_USER is unable to delete himself", (done) => {
    Actor.delete(Url(`users/${SharedData.AuthenticatedUserId}`))
      .set(SharedData.Auth)
      .end((_, res) => {
        AssertStandardResponse(res, Code.FORBIDDEN);
        const { msg, data } = res.body;
        chai.expect(msg).to.be.equal(Message.DELETE_ELEVATION_ERR);
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  for (const id in [SharedData.AdminUserId, SharedData.SuperUserId])
    it("BASIC_USER is unable to delete another user", (done) => {
      Actor.delete(Url(`users/${id}`))
        .set(SharedData.Auth)
        .end((_, res) => {
          AssertStandardResponse(res, Code.FORBIDDEN);
          const { msg, data } = res.body;
          chai.expect(msg).to.be.equal(Message.DELETE_ELEVATION_ERR);
          chai.expect(data).to.be.undefined;
          done();
        });
    });
  it("SUPER_USER is unable to delete another SUPER_USER", (done) => {
    // seed another super user here... rather than test against self
    Actor.post(Url("auth/login"))
      .send(SuperUser)
      .end((_, res) => {
        Actor.delete(Url(`users/${SharedData.SuperUserId}`))
          .set(AuthHeader(res.body.token))
          .end((_, res) => {
            AssertStandardResponse(res, Code.FORBIDDEN);
            const { msg, data } = res.body;
            chai.expect(msg).to.be.equal(Message.IMMORTAL_USER_DELETION_ERR);
            chai.expect(data).to.be.undefined;
            done();
          });
      });
  });
});
