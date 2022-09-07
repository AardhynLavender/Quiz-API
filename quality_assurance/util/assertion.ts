import { Code } from "../../types/http";
import chai from "chai";

interface Response {
  status: number;
  body: any;
}

export const AssertStandardResponse = (
  { status, body }: Response,
  code = Code.SUCCESS
) => {
  chai.expect(status).to.equal(code);
  chai.expect(body).to.have.property("msg");
};
