import chai from "chai";
import chaiHttp from "chai-http";
import Actor from "../actor";
import { AssertStandardResponse } from "../util/assertion";
import { Code } from "../../types/http";
import Url from "../util/request";
import { RetrieveToken } from "../util/session";
import { BasicUser } from "../data/user";
import { GetUser } from "../util/user";
import { UserSharedData } from "quality_assurance";

chai.use(chaiHttp);
describe("User Reading", () => {
  const Message = {
    READ_ELEVATION_ERR: "read requires an elevated permission level",
  };
  const SKIP_ADMIN_USER = 1;
  const SKIP_BASIC_USER = -1;
  const ONE_USER = 1;
  const FIRST_USER = 0;
  const SharedData: UserSharedData = {
    Auth: {
      Authorization: "",
    },
  };
  before(async () => {
    // get the token we stored when authenticating
    const token = await RetrieveToken();
    SharedData.Auth = { Authorization: `Bearer ${token}` };
    // get the user we authenticated previously
    const { id } = (await GetUser(BasicUser.username)) ?? { id: undefined }; // eslint-disable-line no-extra-parens
    chai.expect(id).to.not.be.undefined;
    SharedData.AuthenticatedUserId = id;
  });
  it("BASIC_USER should fail to read all users", (done) => {
    Actor.get(Url("users"))
      .set(SharedData.Auth)
      .end((_, res) => {
        AssertStandardResponse(res, Code.FORBIDDEN);
        const { msg, data } = res.body;
        chai.expect(msg).to.be.equal(Message.READ_ELEVATION_ERR);
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  it("Should fail to read a non-existent user", (done) => {
    const id = SharedData.AuthenticatedUserId! + SKIP_ADMIN_USER; // eslint-disable-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    Actor.get(Url(`users/${id}`))
      .set(SharedData.Auth)
      .end((_, res) => {
        AssertStandardResponse(res, Code.NOTFOUND);
        const { msg, data } = res.body;
        chai.expect(msg).to.be.equal(`No User with the id: ${id} found`);
        chai.expect(data).to.be.undefined;
        done();
      });
  });
  it("Should read an authenticated user", (done) => {
    Actor.get(Url(`users/${SharedData.AuthenticatedUserId}`))
      .set(SharedData.Auth)
      .end((_, res) => {
        AssertStandardResponse(res, Code.SUCCESS);
        const { msg, data } = res.body;
        chai
          .expect(msg)
          .to.be.equal(
            `Fetched record ${SharedData.AuthenticatedUserId} from User`
          );
        chai.expect(data).to.not.be.undefined;
        chai.expect(data).to.be.an("array");
        chai.expect(data.length).to.be.equal(ONE_USER);
        const { id, username, password } = data[FIRST_USER];
        chai.expect(id).to.be.equal(SharedData.AuthenticatedUserId);
        chai.expect(username).to.be.equal(BasicUser.username);
        chai.expect(password).to.equal("*".repeat(password.length));
        done();
      });
  });
  it("Should fail to read a non-authenticated user", (done) => {
    const id = SharedData?.AuthenticatedUserId! + SKIP_BASIC_USER; // eslint-disable-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    Actor.get(Url(`users/${id}`))
      .set(SharedData.Auth)
      .end((_, res) => {
        AssertStandardResponse(res, Code.FORBIDDEN);
        const { msg, data } = res.body;
        chai
          .expect(msg)
          .to.be.equal(
            `A BASIC_USER can only read his own data! Try GET api/users/${SharedData.AuthenticatedUserId}/`
          );
        chai.expect(data).to.be.undefined;
        done();
      });
  });
});
