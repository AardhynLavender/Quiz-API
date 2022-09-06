import { Code } from "../../types/http";
import chai from "chai";

interface Response {
  status: number;
  body: any;
}

export const AssertStandardSuccess = (
  { status, body }: Response,
  code = Code.SUCCESS
) => {
  chai.expect(status).to.equal(code);
  chai.expect(body).to.have.property("msg");
};

export const AssertStandardError = (
  { status, body }: Response,
  code = Code.ERROR
) => {
  chai.expect(status).to.equal(code);
  chai.expect(body).to.have.property("msg");
};
