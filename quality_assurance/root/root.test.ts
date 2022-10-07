import Actor from "../actor";
import Url from "../util/request";
import { AssertStandardResponse } from "../util/assertion";
import { Code } from "../../types/http";
import chai from "chai";
import chaiHttp from "chai-http";

chai.use(chaiHttp);
describe("Root Routes", () => {
  const messages = {
    NO_HANDLER: "No handler is available for the provided URL",
  };
  it("Root route returns available endpoints", (done) => {
    Actor.get(Url("")).end((_, res) => {
      AssertStandardResponse(res, Code.SUCCESS);
      const { msg, data } = res.body;
      chai.expect(msg).to.equal("API Available Endpoints");
      chai.expect(data).to.be.an("array");
      const { path, methods } = data[0];
      chai.expect(path).to.be.a("string");
      chai.expect(methods).to.be.an("array");
      done();
    });
  });
  it("Non-existent route returns an appropriate response", (done) => {
    Actor.get(Url("secrets/1?query='; DROP TABLE secrets; --'")).end(
      (_, res) => {
        AssertStandardResponse(res, Code.NOTFOUND);
        const { msg, data } = res.body;
        chai.expect(msg).to.equal(messages.NO_HANDLER);
        chai.expect(data).to.be.undefined;
        done();
      }
    );
  });
});
