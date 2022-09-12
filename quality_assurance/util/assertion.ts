import { Code } from "../../types/http";
import { Response } from "..";
import chai from "chai";

export const AssertStandardResponse = (
  { status, body }: Response,
  code = Code.SUCCESS
) => {
  chai.expect(status).to.equal(code);
  chai.expect(body).to.have.property("msg");
};
